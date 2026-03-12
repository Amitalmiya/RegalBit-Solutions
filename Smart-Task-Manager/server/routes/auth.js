const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query, queryOne } = require('../db');
const { generateTokens, authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password needs uppercase, lowercase and number (min 8 chars)'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const id = uuidv4();

    await query(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, hashedPassword, 'user']
    );

    const user = await queryOne(
      'SELECT id, name, email, role, is_active, avatar, created_at FROM users WHERE id = ?',
      [id]
    );

    const { accessToken, refreshToken } = generateTokens(id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user, accessToken, refreshToken }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    const { accessToken, refreshToken } = generateTokens(user.id);
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: safeUser, accessToken, refreshToken }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await queryOne(
      'SELECT id, name, email, role, is_active, avatar, last_login, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ success: true, data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('avatar').optional().isURL(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, avatar } = req.body;

  try {
    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (avatar !== undefined) { updates.push('avatar = ?'); values.push(avatar); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(req.user.id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const user = await queryOne(
      'SELECT id, name, email, role, is_active, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({ success: true, message: 'Profile updated', data: { user } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Profile update failed' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const user = await queryOne('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password change failed' });
  }
});

module.exports = router;