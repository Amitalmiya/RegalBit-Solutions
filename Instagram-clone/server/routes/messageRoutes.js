import express from 'express';
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  sharePost,
  deleteMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/conversations',           protect, getConversations);
router.post('/conversations',          protect, getOrCreateConversation);
router.post('/share-post',             protect, sharePost);
router.get('/:conversationId',         protect, getMessages);
router.post('/:conversationId',        protect, sendMessage);
router.delete('/message/:messageId',   protect, deleteMessage);

export default router;