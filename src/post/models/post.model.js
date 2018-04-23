const path = require('path');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');

const APIError = require(path.resolve('./src/api/utils/APIError'));
const PostSchema = require('./schema/post.schema');
const PostEnum = require('./schema/post.enum');


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
PostSchema.pre('save', async (next) => {
  try {
    // TODO: pick the postedby user object

    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Methods
 */
PostSchema.method({
  transform() {
    const transformed = {};
    const fields = ['_id', 'text', 'images', 'location', 'postedBy', 'comments', 'tags', 'waters', 'levels', 'shares', 'createdAt'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

/**
 * Statics
 */
PostSchema.statics = {

  PostEnum,

  /**
   * Get post
   *
   * @param {ObjectId} id - The objectId of post.
   * @returns {Promise<Post, APIError>}
   */
  async get(id) {
    try {
      let post;

      if (mongoose.Types.ObjectId.isValid(id)) {
        post = await this.findById(id).exec();
      }
      if (post) {
        return post;
      }

      throw new APIError({
        message: 'Post does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list({
    page = 1, perPage = 30, name, email, role,
  }) {
    const options = omitBy({ name, email, role }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },
};

/**
 * @typedef Post
 */
module.exports = mongoose.model('Post', PostSchema);
