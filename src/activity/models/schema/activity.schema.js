const mongoose = require('mongoose');

/**
 * Activity Schema
 * @private
 */
const ActivitySchema = new mongoose.Schema({
  activity: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resource: {
    name: String,
    id: mongoose.Schema.Types.ObjectId,
  },
  deleteFlag: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

ActivitySchema.index({ deleteFlag: 1, user: 1, createdAt: -1 });

/**
 * export the schema
 */
module.exports = ActivitySchema;
