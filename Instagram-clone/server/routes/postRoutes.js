import express from 'express';
import {
  createPost,
  getFeed,
  getExplorePosts,
  getPost,
  deletePost,
  toggleLike,
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/feed',    protect, getFeed);
router.get('/explore', protect, getExplorePosts);
router.post('/',       protect, upload.single('image'), createPost);
router.get('/:id',     protect, getPost);
router.delete('/:id',  protect, deletePost);
router.put('/:id/like', protect, toggleLike);

export default router;
