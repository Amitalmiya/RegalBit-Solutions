const db = require('../config/db');

async function createTask(req, res) {
    const { title, description } = req.body;

    if (!title || !description) return res.status(400).send('All fields are required');

    const [result] = await db.promise().query('INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)', [title, description, req.user.id]);

    res.send('Task created');
}

async function getTasks(req, res) {
    const [result] = await db.promise().query('SELECT * FROM tasks WHERE user_id = ?', [req.user.id]);

    res.send(result);
}

async function updateTask(req, res) {
    const { id, title, description } = req.body;

    if (!id || !title || !description) return res.status(400).send('All fields are required');

    const [result] = await db.promise().query('UPDATE tasks SET title = ?, description = ? WHERE id = ?', [title, description, id]);

    res.send('Task updated');
}

async function deleteTask(req, res) {
    const { id } = req.body;

    if (!id) return res.status(400).send('Task ID is required');

    const [result] = await db.promise().query('DELETE FROM tasks WHERE id = ?', [id]);

    res.send('Task deleted');
}

module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask
};
