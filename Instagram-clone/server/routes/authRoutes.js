import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  registerRules,
  loginRules,
  validate,
} from '../middleware/validateMiddleware.js';

const router = express.Router();

// ✅ Spread the rules array with ...registerRules
router.post('/register', ...registerRules, validate, register);
router.post('/login',    ...loginRules,    validate, login);
router.get('/me',        protect,          getMe);

export default router;