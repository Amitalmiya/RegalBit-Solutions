import express from 'express';
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  deleteMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.get('/conversations',              protect, getConversations);
router.post('/conversations',             protect, getOrCreateConversation);
router.get('/:conversationId',            protect, getMessages);
router.post('/:conversationId',           protect, sendMessage);
router.delete('/message/:messageId',      protect, deleteMessage);

export default router;