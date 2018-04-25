const mongoose = require('mongoose');

/**
 * Water Schema
 * @private
 */
const EventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  event: {
    type: String,
    required: true,
  },
  resourceId: {
    type: mongoose.Types.ObjectId,
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
module.exports = EventSchema;
