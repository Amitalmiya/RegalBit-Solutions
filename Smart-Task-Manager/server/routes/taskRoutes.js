const express = require('express');
const { createTask, getTasks, updateTask, deleteTask } = require('../controllers/taskController');
const roleMiddleware = require('../middlewares/roleMiddleware');

const router = express.Router();

router.post('/tasks', createTask);
router.get('/tasks', getTasks);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

router.use(roleMiddleware('admin'));
router.get('/admin/tasks', getTasks);

module.exports = router;
