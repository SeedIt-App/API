const mongoose = require('mongoose');

/**
 * Water Schema
 * @private
 */
const WaterSchema = new mongoose.Schema({
  waterBy: {
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

/**
 * export the schema
 */
module.exports = WaterSchema;
