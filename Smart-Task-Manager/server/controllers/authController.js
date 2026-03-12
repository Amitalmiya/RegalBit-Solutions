const bcrypt = require('bcryptjs');
const db = require('../config/db');
const jwt = require('../utils/jwtUtil');

async function registerUser(req, res) {
    const { username, password } = req.body;

    if (!username || !password) return res.status(400).send('All fields are required');

    const [result] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);

    if (result.length > 0) return res.status(400).send('User already exists');

    const hashedPassword = await bcrypt.hash(password, 8);

    const [insertResult] = await db.promise().query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

    res.send('User registered');
}

async function loginUser(req, res) {
    const { username, password } = req.body;

    if (!username || !password) return res.status(400).send('All fields are required');

    const [result] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);

    if (result.length === 0) return res.status(400).send('User does not exist');

    const user = result[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(400).send('Invalid credentials');

    const token = jwt.generateToken(user);
    res.send({ token });
}

module.exports = {
    registerUser,
    loginUser
};
