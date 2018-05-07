const path = require('path');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const APIError = require(path.resolve('./src/api/utils/error.utils'));
const PostSchema = require('./schema/post.schema');
const PostEnum = require('../utils/post.enum');
const TagModel = require(path.resolve('./src/tag/models/tag.model'));

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
PostSchema.pre('save', async (next) => {
  try {
    // check the postedBy user object is set
    // if (this.user._id) {
    //   // TODO: pick the postedby user object
    //   console.log('Post pre-save middleware to validate & check the posted by users');
    // }
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

  /**
   * check watered & comments after save/update
   * @param {Object} user created user object
   * @param {Boolean} limitComments should limit comments to 3 by default
   */
  afterSave(user, limitComments) {
    const obj = this;
    obj.watered = obj.waters.indexOf(user._id) !== -1;
    if (limitComments && obj.comments && obj.comments.length > 3) {
      obj.hasMoreComments = obj.comments.length - 3;
      obj.comments = obj.comments.slice(0, 3);
    }
    return obj;
  },

  /**
   * List post in descending order of 'createdAt' timestamp.
   *
   * @param {Object} query - request query params
   * @returns {Promise<User[]>}
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
   * Water List post in
   *
   * @param {Object} query - request query params
   * @returns {Promise<User[]>}
   */
  waterList(query) {
    return this.populate('waters', query.select);
  },

  /**
   * Get users object by username mentioned in post text
   * @param {Function} cb callback function
   */
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
      usernames[i] = username.substring(1).toLowerCase();
    });

    /**
     * Find in the db
     */
    const User = mongoose.model('User');

    User.find({ userName: { $in: usernames } })
      .exec((err, users) => {
        if (cb) {
          return cb(err, users);
        }
      });
  },

  /**
   * Get tag object by tagname mentioned in post text
   * @param {Function} cb callback with mentioned tags
   */
  async getMentionedTags(cb) {
    /**
     * Mention format will be #tags
     */
    const te = /#([A-Za-z0-9_]+)/g;

    /**
     * Try to find all the tags
     * @type {Array}
     */
    const tagnames = this.text.match(te);
    if (!tagnames || !tagnames.length) {
      return [];
    }

    /**
     * Remove the '#' symbol
     */
    tagnames.map((tagname, i) => {
      tagnames[i] = tagname.substring(1).toLowerCase();
    });

    // create all new tags
    await TagModel.schema.static.createTags(tagnames, this.postedBy);

    /**
     * Find in the db
     */
    TagModel.find({ tag: { $in: tagnames } })
      .exec((err, tags) => {
        if (cb) {
          return cb(err, tags);
        }
      });
  },

  /**
   * Add mentioned users as post subscriber
   * @param {ObjectId} userId user id
   */
  subscribe(userId) {
    // cannot subscribe to own post
    if (this.subscribers.indexOf(userId) === -1 && this.postedBy !== userId) {
      this.subscribers.push(userId);
    }
  },

  /**
   * Notify post creator for water action
   * @param {*} notification object
   */
  notifyWater(notification) {
    this.populate('postedBy', (err, post) => {
      /**
       * Notify creator, if its not the creator taking this action
       */
      if (post.postedBy._id.toString() !== notification.fromUser.toString()) {
        post.postedBy.notify(notification);
      }
    });
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
