import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    fullName: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: 'https://res.cloudinary.com/demo/image/upload/v1/samples/people/jazz.jpg',
    },
    avatarPublicId: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxlength: [150, 'Bio cannot exceed 150 characters'],
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ✅ Fixed — no next parameter for async hooks in Mongoose v7+
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.matchPassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);