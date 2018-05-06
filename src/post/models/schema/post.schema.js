const mongoose = require('mongoose');
const PostEnum = require('../../utils/post.enum');

/**
 * Post Schema
 * @private
 */
const PostSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  images: [{
    type: String,
    url: String,
    deleteFlag: Boolean,
  }],
  location: {
    type: String,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  }],
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag',
  }],
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  waters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Water',
  }],
  levels: [{
    type: String,
    enum: PostEnum.levels,
    default: 'seed',
  }],
  shares: [{
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    sharedAt: {
      type: Date,
    },
  }],
  spams: [{
    reportBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reportedAt: {
      type: Date,
    },
  }],
  views: {
    type: Number,
  },
  deleteFlag: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

PostSchema.index({
  deleteFlag: 1, postedBy: 1, tag: 1, createdAt: -1,
});

/**
 * export the schema
 */
module.exports = PostSchema;
