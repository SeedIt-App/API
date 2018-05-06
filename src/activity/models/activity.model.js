// Signup
// create post
// comment post
// water post
// follow user
// follow tag
const mongoose = require('mongoose');
const ActivitySchema = require('./schema/activity.schema');

/**
 * @typedef Activity
 */
module.exports = mongoose.model('Activity', ActivitySchema);
