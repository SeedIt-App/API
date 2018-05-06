const mongoose = require('mongoose');
const TagSchema = require('./schema/tag.schema');

/**
 * Method
 */
TagSchema.method({
  /**
   * notify tag followers
   */
  async notify(data) {
    // populate tag followers user object
    this.populate('followers', (err, tag) => {
      tag.followers.map((user) => {
        // notify each followers
        user.notify(data);
      });
    });
  },
});

/**
 * Static
 */
TagSchema.static = {
  /**
   * create new tags
   */
  async createTags(tags, user) {
    const TagModel = mongoose.model('Tag', TagSchema);
    await tags.map((tag) => {
      (new TagModel({
        tag,
        tagBy: user,
      })).save();
    });
  },
};

/**
 * @typedef Tag
 */
module.exports = mongoose.model('Tag', TagSchema);
