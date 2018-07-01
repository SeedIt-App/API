const path = require('path');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const TagSchema = require('./schema/tag.schema');
const APIError = require(path.resolve('./src/api/utils/error.utils'));
const logger = require(path.resolve('./config/logger'));

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
TagSchema.statics = {
  /**
   * Get tag
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async get(id) {
    try {
      let tag;

      if (mongoose.Types.ObjectId.isValid(id)) {
        tag = await this.findById(id).exec();
      }
      if (tag) {
        return tag;
      }

      throw new APIError({
        message: 'Tag does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * create new tags
   */
  async createTags(tags, user) {
    const TagModel = mongoose.model('Tag', TagSchema);
    await tags.map((tag) => {
      (new TagModel({
        tag,
        tagBy: user,
      })).save()
        .then((t) => { logger.log(`New tag saved ${t.tag}`); })
        .catch((e) => { logger.log(`Error in createTags ${e.message}`); });
    });
  },

  /**
   * List tags in descending order of 'createdAt' timestamp.
   * @param {Object} query - request query params
   * @returns {Promise<Tag[]>}
   */
  list(query) {
    return this.find(query.filter)
      .select(query.select)
      .sort(query.sortBy)
      .skip(query.perPage * (query.page - 1))
      .limit(query.perPage)
      .exec();
  },

  /**
   * Get user following Tag Id
   * @param {ObjectId} userId
   * @return {Array} array of Tags Id
   */
  userTags(userId) {
    return this.find({ followers: userId, deleteFlag: false })
      .select('_id')
      .exec();
  },

  /**
   * Return new validation error
   * if error is a mongoose duplicate key error
   *
   * @param {Error} error
   * @returns {Error|APIError}
   */
  checkDuplicateError(error) {
    if (error.name === 'MongoError' || error.code === 11000) {
      // get the duplicate key index
      const begin = error.errmsg.lastIndexOf('index: ') + 7;
      let fieldName = error.errmsg.substring(begin, error.errmsg.lastIndexOf('_1'));
      fieldName = `${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)} already exists`;
      // check email/userName validation errors
      return new APIError({
        message: 'Validation Error',
        errors: [{
          field: fieldName,
          location: 'body',
          messages: [`${fieldName} already exists`],
        }],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack,
      });
    }
    return error;
  },

};

/**
 * @typedef Tag
 */
module.exports = mongoose.model('Tag', TagSchema);
