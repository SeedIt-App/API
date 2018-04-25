const mongoose = require('mongoose');

/**
 * Auth Schema for refresh token
 * @private
 */
const AuthSchema = new mongoose.Schema({
  refreshToken: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userEmail: {
    type: 'String',
    ref: 'User',
    required: true,
  },
  expires: { type: Date },
}, {
  timestamps: true,
});

AuthSchema.index({ refreshToken: 1, userId: 1 });

module.exports = AuthSchema;
