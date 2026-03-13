import Comment from '../models/Comment.js';
import Post from '../models/Post.js';

// POST /api/comments/:postId
export const addComment = async (req, res, next) => {
  try {
    const { text, parentId } = req.body;

    if (!text || !text.trim()) {
      const err = new Error('Comment text is required');
      err.statusCode = 400;
      throw err;
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      throw err;
    }

    const comment = await Comment.create({
      post: req.params.postId,
      author: req.user._id,
      text: text.trim(),
      parent: parentId || null,
    });

    await comment.populate('author', 'username avatar');

    res.status(201).json({ success: true, comment });
  } catch (err) {
    next(err);
  }
};

// GET /api/comments/:postId
export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({
      post: req.params.postId,
      parent: null,
    })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 });

    res.json({ success: true, comments });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/comments/:id
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      const err = new Error('Comment not found');
      err.statusCode = 404;
      throw err;
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      const err = new Error('Not authorized');
      err.statusCode = 403;
      throw err;
    }

    await comment.deleteOne();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};
