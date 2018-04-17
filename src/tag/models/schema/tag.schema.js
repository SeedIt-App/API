const mongoose = require('mongoose');

/**
 * Tag Schema
 * @private
 */
const TagSchema = new mongoose.Schema({
  tag: {
    type: String,
    trim: true,
    maxlength: 200,
    index: true,
    unique: true,
    lowercase: true,
    required: true,
  },
  tagBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deleteFlag: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

TagSchema.index({ deleteFlag: 1, tag: 1, createdAt: -1 });

/**
 * export the schema
 */
module.exports = TagSchema;
