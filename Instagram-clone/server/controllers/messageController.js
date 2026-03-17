import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { io } from '../server.js';

// ── Helper: format conversation ───────────────────────────────────
const formatConv = (conv, currentUserId) => ({
  ...conv.toObject(),
  otherUser: conv.participants.find(
    (p) => p._id.toString() !== currentUserId.toString()
  ),
});

// GET /api/messages/conversations
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username avatar fullName')
      .populate({
        path: 'lastMessage',
        populate: [
          { path: 'sender',     select: 'username' },
          { path: 'sharedPost', select: 'mediaUrl caption' },
        ],
      });

    res.json({
      success: true,
      conversations: conversations.map((c) => formatConv(c, req.user._id)),
    });
  } catch (err) { next(err); }
};

// POST /api/messages/conversations — get or create
export const getOrCreateConversation = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId)
      return res.status(400).json({ success: false, message: 'userId is required' });
    if (userId === req.user._id.toString())
      return res.status(400).json({ success: false, message: 'Cannot message yourself' });

    let conv = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] },
    })
      .populate('participants', 'username avatar fullName')
      .populate('lastMessage');

    if (!conv) {
      conv = await Conversation.create({ participants: [req.user._id, userId] });
      conv = await Conversation.findById(conv._id)
        .populate('participants', 'username avatar fullName');
    }

    res.json({ success: true, conversation: formatConv(conv, req.user._id) });
  } catch (err) { next(err); }
};

// GET /api/messages/:conversationId — get messages
export const getMessages = async (req, res, next) => {
  try {
    const conv = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user._id,
    });
    if (!conv)
      return res.status(404).json({ success: false, message: 'Conversation not found' });

    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'username avatar')
      .populate({
        path: 'sharedPost',
        populate: { path: 'author', select: 'username avatar' },
      })
      .sort({ createdAt: 1 });

    // Mark as seen
    await Message.updateMany(
      { conversation: req.params.conversationId, sender: { $ne: req.user._id }, seen: false },
      { seen: true, seenAt: new Date() }
    );

    res.json({ success: true, messages });
  } catch (err) { next(err); }
};

// POST /api/messages/:conversationId — send text message
export const sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim())
      return res.status(400).json({ success: false, message: 'Message text is required' });

    const conv = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user._id,
    }).populate('participants', '_id');
    if (!conv)
      return res.status(404).json({ success: false, message: 'Conversation not found' });

    const message = await Message.create({
      conversation: req.params.conversationId,
      sender: req.user._id,
      text: text.trim(),
      messageType: 'text',
    });
    await message.populate('sender', 'username avatar');

    await Conversation.findByIdAndUpdate(req.params.conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    conv.participants.forEach((p) => {
      io.to(p._id.toString()).emit('new_message', {
        message,
        conversationId: req.params.conversationId,
      });
    });

    res.status(201).json({ success: true, message });
  } catch (err) { next(err); }
};

// POST /api/messages/share-post — share a post to multiple users
export const sharePost = async (req, res, next) => {
  try {
    const { postId, userIds, caption } = req.body;

    if (!postId || !userIds?.length)
      return res.status(400).json({ success: false, message: 'postId and userIds are required' });

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ success: false, message: 'Post not found' });

    const results = [];

    for (const userId of userIds) {
      if (userId === req.user._id.toString()) continue;

      // Get or create conversation
      let conv = await Conversation.findOne({
        participants: { $all: [req.user._id, userId] },
      });
      if (!conv) {
        conv = await Conversation.create({ participants: [req.user._id, userId] });
      }

      // Create the shared post message
      const message = await Message.create({
        conversation: conv._id,
        sender: req.user._id,
        text: caption || '',
        sharedPost: postId,
        messageType: 'post_share',
      });

      await message.populate('sender', 'username avatar');
      await message.populate({
        path: 'sharedPost',
        populate: { path: 'author', select: 'username avatar' },
      });

      await Conversation.findByIdAndUpdate(conv._id, {
        lastMessage: message._id,
        lastMessageAt: new Date(),
      });

      // Notify both participants
      [req.user._id.toString(), userId].forEach((uid) => {
        io.to(uid).emit('new_message', { message, conversationId: conv._id.toString() });
      });

      results.push({ userId, conversationId: conv._id });
    }

    res.status(201).json({ success: true, shared: results.length, results });
  } catch (err) { next(err); }
};

// DELETE /api/messages/message/:messageId
export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message)
      return res.status(404).json({ success: false, message: 'Message not found' });
    if (message.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    await message.deleteOne();
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) { next(err); }
};