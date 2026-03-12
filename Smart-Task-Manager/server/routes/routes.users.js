const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne } = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// GET /api/users — admin/superadmin list all users
router.get('/', authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { search, role, isActive, page = 1, limit = 20 } = req.query;
    const limitNum = parseInt(limit, 10) || 20;
    const pageNum = parseInt(page, 10) || 1;
    const offsetNum = (pageNum - 1) * limitNum;

    let conditions = [];
    let params = [];

    // Admin cannot see superadmins
    if (req.user.role === 'admin') {
      conditions.push("role != 'superadmin'");
    }

    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }
    if (isActive !== undefined) {
      conditions.push('is_active = ?');
      params.push(isActive === 'true' ? 1 : 0);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const users = await query(`
      SELECT id, name, email, role, is_active, avatar, last_login, created_at,
        (SELECT COUNT(*) FROM tasks WHERE owner_id = users.id) AS task_count
      FROM users ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `, params);

    const [countRow] = await query(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: countRow.total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(countRow.total / limitNum)
        }
      }
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// GET /api/users/stats — admin stats
router.get('/stats', authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const stats = await queryOne(`
      SELECT
        COUNT(*) AS total_users,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) AS total_regular,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS total_admins,
        SUM(CASE WHEN role = 'superadmin' THEN 1 ELSE 0 END) AS total_superadmins,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_users,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive_users
      FROM users
    `);

    const taskStats = await queryOne(`
      SELECT
        COUNT(*) AS total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN due_date < NOW() AND status NOT IN ('completed','cancelled') THEN 1 ELSE 0 END) AS overdue
      FROM tasks
    `);

    res.json({
      success: true,
      data: { userStats: stats, taskStats }
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
});

// GET /api/users/:id
router.get('/:id', authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const user = await queryOne(
      'SELECT id, name, email, role, is_active, avatar, last_login, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.user.role === 'admin' && user.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({ success: true, data: { user } });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// POST /api/users — admin creates user
router.post('/', authorize('admin', 'superadmin'), [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['user', 'admin', 'superadmin']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { name, email, password, role } = req.body;

  // Admin cannot create superadmin
  if (req.user.role === 'admin' && role === 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Admins cannot create superadmin accounts'
    });
  }

  try {
    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const id = uuidv4();
    const hashed = await bcrypt.hash(password, 12);
    await query(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, hashed, role]
    );

    const user = await queryOne(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
    res.status(201).json({
      success: true,
      message: 'User created',
      data: { user }
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

// PUT /api/users/:id — update user
router.put('/:id', authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const target = await queryOne('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Permission checks
    if (req.user.role === 'admin' && target.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify superadmin'
      });
    }
    if (req.user.role === 'admin' && req.body.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot promote to superadmin'
      });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Use profile settings to update yourself'
      });
    }

    const { name, role, is_active } = req.body;
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (role) {
      updates.push('role = ?');
      values.push(role);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes'
      });
    }

    values.push(req.params.id);
    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const user = await queryOne(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    res.json({
      success: true,
      message: 'User updated',
      data: { user }
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// DELETE /api/users/:id — superadmin only
router.delete('/:id', authorize('superadmin'), async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete yourself'
    });
  }
  try {
    const target = await queryOne('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({
      success: true,
      message: 'User deleted permanently'
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

module.exports = router;