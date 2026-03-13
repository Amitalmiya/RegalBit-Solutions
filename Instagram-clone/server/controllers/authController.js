import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password) {
      const err = new Error('Please provide username, email and password');
      err.statusCode = 400;
      throw err;
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const err = new Error('User with this email or username already exists');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.create({ username, email, password, fullName });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const err = new Error('Please provide email and password');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
