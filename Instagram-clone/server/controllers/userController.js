import User from '../models/User.js';
import Post from '../models/Post.js';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'instagram-clone/avatars', resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// GET /api/users/:username
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const posts = await Post.find({ author: user._id, isArchived: false })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      user,
      posts,
      postsCount: posts.length,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/profile — Update profile
export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, bio, website } = req.body;
    const updateData = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;

    // Handle avatar upload
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);

      // Delete old avatar from Cloudinary if exists
      if (req.user.avatarPublicId) {
        await cloudinary.uploader.destroy(req.user.avatarPublicId);
      }

      updateData.avatar = result.secure_url;
      updateData.avatarPublicId = result.public_id;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id/follow — Toggle follow
export const toggleFollow = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const currentId = req.user._id;

    if (targetId === currentId.toString()) {
      const err = new Error('You cannot follow yourself');
      err.statusCode = 400;
      throw err;
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const isFollowing = targetUser.followers.includes(currentId);

    if (isFollowing) {
      await User.findByIdAndUpdate(targetId, { $pull: { followers: currentId } });
      await User.findByIdAndUpdate(currentId, { $pull: { following: targetId } });
    } else {
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: currentId } });
      await User.findByIdAndUpdate(currentId, { $addToSet: { following: targetId } });
    }

    res.json({
      success: true,
      following: !isFollowing,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/suggestions — Get follow suggestions
export const getSuggestions = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const following = currentUser.following;

    const suggestions = await User.find({
      _id: { $nin: [...following, req.user._id] },
    })
      .limit(5)
      .select('username avatar fullName followers');

    res.json({ success: true, suggestions });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/search?q=query
export const searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q;
    if (!query) return res.json({ success: true, users: [] });

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
      ],
    })
      .limit(10)
      .select('username avatar fullName');

    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};
