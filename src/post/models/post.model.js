const path = require('path');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const {
  findIndex,
  filter,
  matches,
  merge,
} = require('lodash');
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
    // obj.watered = obj.waters.indexOf(user._id) !== -1;
    if (limitComments && obj.comments && obj.comments.length > 3) {
      obj.hasMoreComments = obj.comments.length - 3;
      obj.comments = obj.comments.slice(0, 3);
    }
    return obj;
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
      return cb(null, []);
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
      return cb(null, []);
    }

    /**
     * Remove the '#' symbol
     */
    tagnames.map((tagname, i) => {
      tagnames[i] = tagname.substring(1).toLowerCase();
    });

    // create all new tags
    await TagModel.createTags(tagnames, this.postedBy);

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
  subscribe(user) {
    // cannot subscribe to own post
    if (this.subscribers.indexOf(user._id) === -1 && this.postedBy !== user._id) {
      this.subscribers.addToSet(user);
    }
  },

  /**
   * Notify post creator for water, comment action
   * @param {*} notification object
   */
  notifyActions(notification) {
    this.populate('postedBy', (err, post) => {
      /**
       * Notify creator, if its not the creator taking this action
       */
      if (post.postedBy._id.toString() !== notification.fromUser.toString()) {
        post.postedBy.notify(notification);
      }
    });
  },

  /**
   * Get comment from post comments array
   * @param {ObjectId} id comment id
   */
  commentById(id) {
    // check id is mongoose object id
    if (mongoose.Types.ObjectId.isValid(id)) {
      const comments = filter(this.comments, matches({ _id: mongoose.Types.ObjectId(id) }));
      // filter will return in array pass only single object
      return comments[0];
    }
    return false;
  },

  /**
   * Get comment from post comments array
   * @param {Object} comment comment object with replies
   */
  replaceComment(comment) {
    // check id is mongoose object id
    const index = findIndex(this.comments, { _id: comment._id });
    // merge the new comment object to replace
    return merge(this.comments[index], comment);
  },

  /**
   * notify users
   * @param {*} data
   * @param {*} System
   */
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
   * List post in descending order of 'createdAt' timestamp.
   *
   * @param {Object} query - request query params
   * @returns {Promise<User[]>}
   */
  list(query) {
    return this.find(query.filter)
      .select(query.select)
      .populate('tags', query.with.tags)
      .populate('postedBy', query.with.postedBy)
      .populate({
        path: 'comments.commentBy',
        model: 'User',
        select: query.with.commentBy,
      })
      .populate({
        path: 'comments.replies.replyBy',
        model: 'User',
        select: query.with.replyBy,
      })
      .sort(query.sortBy)
      .skip(query.perPage * (query.page - 1))
      .limit(query.perPage)
      .exec();
  },
};

/**
 * @typedef Post
 */
module.exports = mongoose.model('Post', PostSchema);
