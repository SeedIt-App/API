const path = require('path');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const APIError = require(path.resolve('./src/api/utils/error.utils'));
const PostSchema = require('./schema/post.schema');
const PostEnum = require('../utils/post.enum');


/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
PostSchema.pre('save', async (next) => {
  try {
    // check the postedBy user object is set
    if (this.user._id) {
      // TODO: pick the postedby user object
      console.log('Post pre-save middleware to validate & check the posted by users');
    }
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

  afterSave(user, limitComments) {
    const obj = this;
    obj.liked = obj.likes.indexOf(user._id) !== -1;
    if (limitComments && obj.comments && obj.comments.length > 3) {
      obj.hasMoreComments = obj.comments.length - 3;
      obj.comments = obj.comments.slice(0, 3);
    }
    return obj;
  },

  getMentionedTags(cb) {
    /**
     * Mention format will be #tags
     */
    const te = /#([A-Za-z0-9_]+)/g;

    /**
     * Try to find all the tags
     * @type {Array}
     */
    const tags = this.text.match(te);

    if (!tags || !tags.length) {
      return [];
    }

    /**
     * Remove the '@' symbol
     */
    tags.map((username, i) => {
      tags[i] = username.substring(1);
    });

    /**
     * Find in the db
     */
    const User = mongoose.model('User');

    User.find({ username: { $in: tags } })
      .exec((err, users) => {
        if (cb) {
          return cb(err, users);
        }
      });
  },

  getMentionedUsers(cb) {
    /**
     * Mention format will be @xyz
     */
    const re = /@([A-Za-z0-9_]+)/g;

    /**
     * Try to find the usernames
     * @type {Array}
     */
    const usernames = this.text.match(re);

    if (!usernames || !usernames.length) {
      return [];
    }

    /**
     * Remove the '@' symbol
     */
    usernames.map((username, i) => {
      usernames[i] = username.substring(1);
    });

    /**
     * Find in the db
     */
    const User = mongoose.model('User');

    User.find({ username: { $in: usernames } })
      .exec((err, users) => {
        if (cb) {
          return cb(err, users);
        }
      });
  },

  subscribe(userId) {
    // cannot subscribe to own post
    if (this.subscribers.indexOf(userId) === -1 && this._id !== userId) {
      this.subscribers.push(userId);
    }
  },

  notifyUsers(data, System) {
    const notification = {
      postId: this._id,
      actorId: data.actorId,
      notificationType: data.type,
      config: data.config,
    };

    this.populate('creator subscribers', (err, post) => {
      post.subscribers.map((user) => {
        /**
         * Ignore creator, because we have a special call for that later
         */
        if (user._id.toString() === post.creator._id.toString()) {
          return false;
        }
        /**
         * Ignore the person taking this action
         */
        if (user._id.toString() === data.actorId.toString()) {
          return false;
        }
        /**
         * Notify
         */
        return user.notify(notification, System);
      });

      /**
       * Notify creator, if its not the creator taking this action
       */
      if (post.creator._id.toString() !== data.actorId.toString()) {
        post.creator.notify(notification, System);
      }
    });
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
