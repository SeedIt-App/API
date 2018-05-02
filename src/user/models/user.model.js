const path = require('path');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const uuidv4 = require('uuid/v4');
const UserEnum = require('../utils/user.enum');
const UserSchema = require('./schema/user.schema');
const APIError = require(path.resolve('./src/api/utils/error.utils'));
const { env, resetExpireInterval } = require(path.resolve('./config/vars'));

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
UserSchema.pre('save', async function save(next) {
  try {
    if (!this.isModified('password')) return next();

    const rounds = env === 'test' ? 1 : 10;

    const hash = await bcrypt.hash(this.password, rounds);
    this.password = hash;

    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Methods
 */
UserSchema.method({
  transform() {
    // always remove secure fields from user object
    this.password = undefined;

    return this;
  },

  async passwordMatches(password) {
    return bcrypt.compare(password, this.password);
  },

  /**
   * Send notification to this user
   * @param  {Object} data   The data containing notification infp
   * @return {Void}
   */
  notify(data) {
    // data = data || {};
    // data.config = data.config || {};

    /**
     * Save a ref to self
     * @type {Object}
     */
    const thisUser = this;

    /**
     * If notifications is not an object (array), initialize it
     */
    if (!thisUser.notifications || typeof thisUser.notifications !== 'object') {
      thisUser.notifications = [];
    }

    /**
     * Load the user model
     * @type {Object}
     */
    const User = mongoose.model('User');

    /**
     * Set a ref to notifications plugin
     * @type {Object}
     */
    // const notifications = System.plugins.notifications;

    /**
     * Do the actual notification
     * This will be called after populating required fields in the data
     * @param  {Object} fullData Populated object containing actor and user data
     * @return {Void}
     */
    doNotify(fullData) {
      /**
       * If socketId is enabled, send a push
       */
      if (thisUser.socketId) {
        //get total unread count
        var unread = thisUser.notifications.filter((item) => {
          return item.unread;
        }).length;
        fullData.unread = unread;
        notifications.send(thisUser.socketId, fullData);

        console.log(thisUser.name, 'is notified in the browser.');
      }

      /**
       * If socketId is not enabled, send an email
       */
      if (!thisUser.socketId && !fullData.config.avoidEmail) {
        console.log(thisUser.name, 'is notified via email.');
        // 'Hi ' + user.name + ', you\'ve got a new notification on AtWork!<br><br>Check it out here: ' + '<a href="http://localhost:8111/post/' + data.postId + '">View</a>' // html body

        var msg = '';

        switch (fullData.notificationType) {
          case 'like':
          msg = fullData.actor.name + ' has liked a post';
          break;

          case 'comment':
          msg = fullData.actor.name + ' has commented on a post';
          break;

          case 'follow':
          msg = fullData.actor.name + ' is now following you';
          break;

          case 'mention':
          msg = fullData.actor.name + ' mentioned you in a post';

          case 'chatMessage':
          msg = fullData.actor.name + ' sent you this message: ' + (fullData.chatMessage ? fullData.chatMessage.message : '');
          break;
        }

        System.plugins.emailing.generate({
          name: thisUser.name,
          message: msg,
          action: fullData.postId ? 'View Post' : 'View Profile',
          href: fullData.postId ? System.config.baseURL + '/post/' + fullData.postId : System.config.baseURL + '/profile/' + fullData.actor.username
        }, function(html) {
          fullData.html = html;
          notifications.sendByEmail(thisUser, fullData);
        });
      }
    };

    /**
     * Populate the actor
     */
    User.findOne({_id: data.actorId}).exec((err, actor) => {
      data.actor = actor;
      doNotify(data);
    });

    /**
     * Add the notification data to the user
     */
    if (!data.config.systemLevel) {
      thisUser.notifications.push({
        post: data.postId,
        user: data.userId,
        actor: data.actorId,
        notificationType: data.notificationType
      });
    }

    /**
     * Sort all notifications in order
     */
    thisUser.notifications.sort((a, b) => {
      var dt1 = new Date(a.created);
      var dt2 = new Date(b.created);
      if (dt1 > dt2) {
        return -1;
      } else {
        return 1;
      }
    });

    /**
     * Save the current user
     */
    return thisUser.save((err, user) => {
      return user;
    });
  },

  /**
   * Send a notification to all followers
   * @param  {Object} data   The notification data
   * @param  {Object} System The core system object
   * @return {Void}
   */
  notifyFollowers: function(data, System) {
    var User = mongoose.model('User');
    User.find({following: this._id}, function(err, followers) {
      followers.map(function(follower) {
        follower.notify(data, System);
      });
    });
  },

});

/**
 * Statics
 */
UserSchema.statics = {

  /**
   * User enum values
   */
  enum: UserEnum,

  /**
   * Get user
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async get(id) {
    try {
      let user;

      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await this.findById(id).exec();
      }
      if (user) {
        return user;
      }

      throw new APIError({
        message: 'User does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Find user by email and tries to generate a JWT token
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async findByOptions(options) {
    // collect the possible params from options
    const {
      email, userName, password, refreshObject,
    } = options;

    // check the mandatory fields
    if (!email && !userName) throw new APIError({ message: 'An Username or Email is required to generate a token' });

    const user = await this.findOne({ $or: [{ email }, { userName }] }).exec();
    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (password) {
      if (user && await user.passwordMatches(password)) {
        return user;
      }
      err.message = 'Incorrect email or password';
    } else if (refreshObject && refreshObject.userEmail === email) {
      return user;
    } else {
      err.message = 'Incorrect email or refreshToken';
    }
    throw new APIError(err);
  },

  /**
   * Find user by email and update reset token
   *
   * @param {email} email - users email address
   * @returns {Promise<User, APIError>}
   */
  async findAndReset(email) {
    // check the mandatory fields
    if (!email) throw new APIError({ message: 'An Email is required to reset user password' });

    const user = await this.findOne({ email }).exec();
    // check for valid token
    if (!user) throw new APIError({ message: 'Email not registered in SeedIt' });
    // update the token and expiry time
    user.resetToken = uuidv4();
    user.resetExpireAt = moment().add(resetExpireInterval, 'minutes');

    // update the user data
    await user.save();
    // return the user object
    return user;
  },

  /**
   * Find user by email and update reset token
   *
   * @param {email} email - users email address
   * @returns {Promise<User, APIError>}
   */
  async findAndResetPassword(resetToken, newPassword) {
    const user = await this.findOne({ resetToken }).exec();
    // check for valid token
    if (!user) throw new APIError({ message: 'Invalid reset token' });
    // check token is valid with no expiry date
    if (user.resetExpireAt < moment()) throw new APIError({ message: 'Reset token expired' });
    // update the password
    user.password = newPassword;
    // remove the reset token
    user.resetToken = undefined;
    user.resetExpireAt = undefined;
    // update the user data
    await user.save();
    // return the user object
    return user;
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
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

  async oAuthLogin({
    service, id, email, name, picture,
  }) {
    const user = await this.findOne({ $or: [{ [`services.${service}`]: id }, { email }] });
    if (user) {
      user.services[service] = id;
      if (!user.name) user.name = name;
      if (!user.picture) user.picture = picture;
      return user.save();
    }
    const password = uuidv4();
    return this.create({
      services: { [service]: id }, email, password, name, picture,
    });
  },
};

/**
 * @typedef User
 */
module.exports = mongoose.model('User', UserSchema);
