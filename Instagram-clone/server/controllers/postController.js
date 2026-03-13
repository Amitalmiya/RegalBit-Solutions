import cloudinary from '../config/cloudinary.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import streamifier from 'streamifier';
import { io } from '../server.js';

// Upload buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'instagram-clone', resource_type: 'auto' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// POST /api/posts — Create post
export const createPost = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('Image is required');
      err.statusCode = 400;
      throw err;
    }

    const result = await uploadToCloudinary(req.file.buffer);

    const post = await Post.create({
      author: req.user._id,
      mediaUrl: result.secure_url,
      publicId: result.public_id,
      caption: req.body.caption || '',
      location: req.body.location || '',
      tags: req.body.tags ? req.body.tags.split(',').map((t) => t.trim()) : [],
    });

    await post.populate('author', 'username avatar');

    res.status(201).json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/feed — Get feed
export const getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const following = req.user.following;
    const authorIds = [...following, req.user._id];

    const posts = await Post.find({
      author: { $in: authorIds },
      isArchived: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username avatar')
      .populate('commentCount');

    const total = await Post.countDocuments({
      author: { $in: authorIds },
      isArchived: false,
    });

    res.json({
      success: true,
      posts,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/explore — Explore posts
export const getExplorePosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ isArchived: false })
      .sort({ likes: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username avatar');

    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
};

// GET /api/posts/:id — Get single post
export const getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar fullName')
      .populate('likes', 'username avatar');

    if (!post) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      throw err;
    }

    const comments = await Comment.find({ post: post._id, parent: null })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 });

    res.json({ success: true, post, comments });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/posts/:id — Delete post
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      throw err;
    }

    if (post.author.toString() !== req.user._id.toString()) {
      const err = new Error('Not authorized to delete this post');
      err.statusCode = 403;
      throw err;
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(post.publicId);

    // Delete all comments on this post
    await Comment.deleteMany({ post: post._id });

    await post.deleteOne();

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/posts/:id/like — Toggle like
export const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', '_id');

    if (!post) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      throw err;
    }

    const userId = req.user._id;
    const isLiked = post.likes.includes(userId);

    const update = isLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, update, { new: true });

    // Real-time notification
    if (!isLiked && post.author._id.toString() !== userId.toString()) {
      io.to(post.author._id.toString()).emit('notification', {
        type: 'like',
        from: req.user.username,
        postId: post._id,
        message: `${req.user.username} liked your post`,
      });
    }

    res.json({
      success: true,
      liked: !isLiked,
      likesCount: updatedPost.likes.length,
    });
  } catch (err) {
    next(err);
  }
};
