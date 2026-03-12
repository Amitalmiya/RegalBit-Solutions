const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All task routes require auth
router.use(authenticate);

// GET /api/tasks — list tasks (role-based filtering)
router.get('/', async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      search,
      assignedTo,
      page = 1,
      limit = 20
    } = req.query;

    const limitNum = parseInt(limit, 10) || 20;
    const pageNum = parseInt(page, 10) || 1;
    const offsetNum = (pageNum - 1) * limitNum;

    let conditions = [];
    let params = [];

    // Role-based visibility
    if (req.user.role === 'user') {
      conditions.push('(t.owner_id = ? OR t.assigned_to = ?)');
      params.push(req.user.id, req.user.id);
    }
    // admin and superadmin see all tasks

    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('t.priority = ?');
      params.push(priority);
    }
    if (category) {
      conditions.push('t.category = ?');
      params.push(category);
    }
    if (assignedTo) {
      conditions.push('t.assigned_to = ?');
      params.push(assignedTo);
    }
    if (search) {
      conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const tasks = await query(`
      SELECT 
        t.*,
        u1.name AS owner_name, u1.email AS owner_email, u1.avatar AS owner_avatar,
        u2.name AS assigned_to_name, u2.email AS assigned_to_email, u2.avatar AS assigned_to_avatar,
        (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id) AS comment_count
      FROM tasks t
      LEFT JOIN users u1 ON t.owner_id = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      ${whereClause}
      ORDER BY 
        CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        t.due_date ASC, t.created_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `, params);

    const countResult = await query(
      `SELECT COUNT(*) AS total FROM tasks t ${whereClause}`,
      params
    );

    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

// GET /api/tasks/stats — dashboard stats
router.get('/stats', async (req, res) => {
  try {
    let ownerFilter = '';
    let params = [];

    if (req.user.role === 'user') {
      ownerFilter = 'WHERE (owner_id = ? OR assigned_to = ?)';
      params = [req.user.id, req.user.id];
    }

    const stats = await query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) AS todo,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) AS urgent,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) AS high_priority,
        SUM(CASE WHEN due_date < NOW() AND status NOT IN ('completed','cancelled') THEN 1 ELSE 0 END) AS overdue
      FROM tasks ${ownerFilter}
    `, params);

    res.json({
      success: true,
      data: { stats: stats[0] }
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
});

// GET /api/tasks/:id — get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await queryOne(`
      SELECT 
        t.*,
        u1.name AS owner_name, u1.email AS owner_email, u1.avatar AS owner_avatar,
        u2.name AS assigned_to_name, u2.email AS assigned_to_email
      FROM tasks t
      LEFT JOIN users u1 ON t.owner_id = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE t.id = ?
    `, [req.params.id]);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Permission check for regular users
    if (
      req.user.role === 'user' &&
      task.owner_id !== req.user.id &&
      task.assigned_to !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const comments = await query(`
      SELECT tc.*, u.name AS user_name, u.avatar AS user_avatar
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = ?
      ORDER BY tc.created_at ASC
    `, [req.params.id]);

    res.json({
      success: true,
      data: { task: { ...task, comments } }
    });
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task'
    });
  }
});

// POST /api/tasks — create task
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title required (max 255 chars)'),
  body('description').optional().isLength({ max: 5000 }),
  body('status').optional().isIn(['todo', 'in_progress', 'completed', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional().isISO8601(),
  body('assignedTo').optional().isUUID(),
  body('category').optional().trim().isLength({ max: 100 }),
  body('tags').optional().isArray(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const {
    title,
    description,
    status,
    priority,
    dueDate,
    assignedTo,
    category,
    tags
  } = req.body;

  try {
    // Validate assignedTo user exists
    if (assignedTo) {
      const assignee = await queryOne(
        'SELECT id FROM users WHERE id = ? AND is_active = 1',
        [assignedTo]
      );
      if (!assignee) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user not found'
        });
      }
    }

    const id = uuidv4();
    await query(`
      INSERT INTO tasks (id, title, description, status, priority, due_date, owner_id, assigned_to, category, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      title,
      description || null,
      status || 'todo',
      priority || 'medium',
      dueDate || null,
      req.user.id,
      assignedTo || null,
      category || null,
      tags ? JSON.stringify(tags) : null
    ]);

    const task = await queryOne(`
      SELECT t.*, u1.name AS owner_name, u2.name AS assigned_to_name
      FROM tasks t
      LEFT JOIN users u1 ON t.owner_id = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE t.id = ?
    `, [id]);

    res.status(201).json({
      success: true,
      message: 'Task created',
      data: { task }
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create task'
    });
  }
});

// PUT /api/tasks/:id — update task
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('status').optional().isIn(['todo', 'in_progress', 'completed', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('dueDate').optional({ nullable: true }).isISO8601(),
  body('assignedTo').optional({ nullable: true }).isUUID(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const task = await queryOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Permission: user can only edit own tasks
    if (req.user.role === 'user' && task.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      category,
      tags
    } = req.body;

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
      if (status === 'completed') {
        updates.push('completed_at = NOW()');
      } else {
        updates.push('completed_at = NULL');
      }
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (dueDate !== undefined) {
      updates.push('due_date = ?');
      values.push(dueDate || null);
    }
    if (assignedTo !== undefined) {
      updates.push('assigned_to = ?');
      values.push(assignedTo || null);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(tags));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(req.params.id);
    await query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updated = await queryOne(`
      SELECT t.*, u1.name AS owner_name, u2.name AS assigned_to_name
      FROM tasks t
      LEFT JOIN users u1 ON t.owner_id = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE t.id = ?
    `, [req.params.id]);

    res.json({
      success: true,
      message: 'Task updated',
      data: { task: updated }
    });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update task'
    });
  }
});

// DELETE /api/tasks/:id — delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await queryOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Permission: user can only delete own tasks
    if (req.user.role === 'user' && task.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({
      success: true,
      message: 'Task deleted'
    });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
});

// POST /api/tasks/:id/comments — add comment
router.post('/:id/comments', [
  body('content').trim().isLength({ min: 1, max: 2000 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const task = await queryOne('SELECT id FROM tasks WHERE id = ?', [req.params.id]);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const id = uuidv4();
    await query(
      'INSERT INTO task_comments (id, task_id, user_id, content) VALUES (?, ?, ?, ?)',
      [id, req.params.id, req.user.id, req.body.content]
    );

    const comment = await queryOne(`
      SELECT tc.*, u.name AS user_name, u.avatar AS user_avatar
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.id = ?
    `, [id]);

    res.status(201).json({
      success: true,
      data: { comment }
    });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
});

module.exports = router;