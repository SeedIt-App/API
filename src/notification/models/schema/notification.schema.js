const mongoose = require('mongoose');

/**
 * Notification Schema
 * @private
 */
const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  message: {
    type: String,
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notificationType: String,
  resource: {
    name: String,
    id: mongoose.Schema.Types.ObjectId,
  },
  readFlag: {
    type: Boolean,
    default: true,
  },
  devices: [{
    type: String,
  }],
  email: {
    type: String,
  },
  phone: {
    type: Number,
  },
  deleteFlag: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

/**
 * export the schema
 */
module.exports = NotificationSchema;
