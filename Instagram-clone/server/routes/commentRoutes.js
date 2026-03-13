import express from 'express';
import {
  addComment,
  getComments,
  deleteComment,
} from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/:postId',  protect, addComment);
router.get('/:postId',   protect, getComments);
router.delete('/:id',    protect, deleteComment);

export default router;
