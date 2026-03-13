import express from 'express';
import {
  getUserProfile,
  updateProfile,
  toggleFollow,
  getSuggestions,
  searchUsers,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/search',      protect, searchUsers);
router.get('/suggestions', protect, getSuggestions);
router.put('/profile',     protect, upload.single('avatar'), updateProfile);
router.put('/:id/follow',  protect, toggleFollow);
router.get('/:username',   protect, getUserProfile);

export default router;
