import { body, validationResult } from 'express-validator';

// ─── Reusable validate function ───────────────────────────────────
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = {};
    errors.array().forEach((err) => {
      const field = err.path || err.param; // works for v6 and v7
      if (!formatted[field]) formatted[field] = err.msg;
    });
    return res.status(400).json({ success: false, errors: formatted });
  }
  return next(); // ✅ always return next()
};

// ─── Register rules ───────────────────────────────────────────────
export const registerRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters')
    .matches(/^[a-zA-Z0-9._]+$/).withMessage('Only letters, numbers, dots and underscores allowed')
    .toLowerCase(),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 60 }).withMessage('Full name cannot exceed 60 characters'),
];

// ─── Login rules ──────────────────────────────────────────────────
export const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];