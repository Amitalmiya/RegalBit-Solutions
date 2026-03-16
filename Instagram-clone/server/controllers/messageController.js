import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { io } from '../server.js';

// GET /api/messages/conversations — all conversations for current user
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username avatar fullName')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username' },
      });

    // Filter out current user from participants list
    const formatted = conversations.map((c) => ({
      ...c.toObject(),
      otherUser: c.participants.find(
        (p) => p._id.toString() !== req.user._id.toString()
      ),
    }));

    res.json({ success: true, conversations: formatted });
  } catch (err) {
    next(err);
  }
};

// POST /api/messages/conversations — create or get existing conversation
export const getOrCreateConversation = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot message yourself' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] },
    })
      .populate('participants', 'username avatar fullName')
      .populate('lastMessage');

    // Create if not exists
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
      });
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'username avatar fullName');
    }

    const otherUser = conversation.participants.find(
      (p) => p._id.toString() !== req.user._id.toString()
    );

    res.json({ success: true, conversation: { ...conversation.toObject(), otherUser } });
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/:conversationId — get messages in a conversation
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    // Verify user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: 1 });

    // Mark unseen messages as seen
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        seen: false,
      },
      { seen: true, seenAt: new Date() }
    );

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};

// POST /api/messages/:conversationId — send a message
export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    // Verify participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    }).populate('participants', '_id');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Create the message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text: text.trim(),
    });

    await message.populate('sender', 'username avatar');

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage:   message._id,
      lastMessageAt: new Date(),
    });

    // Emit to all participants in real time via Socket.io
    conversation.participants.forEach((participant) => {
      io.to(participant._id.toString()).emit('new_message', {
        message,
        conversationId,
      });
    });

    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/messages/:messageId — delete a message
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await message.deleteOne();
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
};