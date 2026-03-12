const jwt = require('jsonwebtoken');
const { queryOne } = require('../db');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
  return { accessToken, refreshToken };
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await queryOne(
      'SELECT id, name, email, role, is_active, avatar FROM users WHERE id = ?',
      [decoded.userId]
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated'
      });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await queryOne(
        'SELECT id, name, email, role, is_active, avatar FROM users WHERE id = ?',
        [decoded.userId]
      );
      if (user && user.is_active) req.user = user;
    }
  } catch (err) {
    /* ignore */
  }
  next();
};

module.exports = { generateTokens, authenticate, authorize, optionalAuth };