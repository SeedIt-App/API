const mongoose = require('mongoose');

/**
 * Comment Schema
 * @private
 */
const CommentSchema = new mongoose.Schema({
  text: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  commentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  replies: [{
    text: {
      type: String,
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    repliedAt: Date,
  }],
  deleteFlag: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

CommentSchema.index({ deleteFlag: 1, commentBy: 1, createdAt: -1 });

/**
 * export the schema
 */
module.exports = CommentSchema;
