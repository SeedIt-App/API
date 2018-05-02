const mongoose = require('mongoose');

/**
 * User Schema
 * @private
 */
const UserSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  actor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  created: {
    type: Date,
    default: Date.now,
  },
  notificationType: String,
  unread: {
    type: Boolean,
    default: true,
  },
});

/**
 * export the schema
 */
module.exports = UserSchema;
