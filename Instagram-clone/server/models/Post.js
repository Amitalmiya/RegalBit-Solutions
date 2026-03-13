import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mediaUrl: {
      type: String,
      required: [true, 'Media URL is required'],
    },
    publicId: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
      default: '',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      type: String,
      default: '',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Virtual: comment count
postSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  count: true,
});

// Index for fast feed queries
postSchema.index({ author: 1, createdAt: -1 });

export default mongoose.model('Post', postSchema);
