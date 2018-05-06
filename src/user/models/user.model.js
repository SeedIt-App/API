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
const Notification = require(path.resolve('./src/notification/models/notification.model'));

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
    // check and set data config
    data.config = data.config || {};

    /**
     * Save a ref to self
     * @type {Object}
     */
    const thisUser = this;

    /**
     * Add to user id to data
     */
    data.toUser = thisUser;

    /**
     * Get the user noficiation config
     */
    if (thisUser.notifications) {
      /**
       * check push notification device id
       */
      if (thisUser.notifications.push) {
        data.devices = [];
        thisUser.devices.map((device) => {
          data.devices.push(device.id);
        });
      }
      /**
       * check email notification
       */
      if (thisUser.notifications.mail) {
        data.email = thisUser.email;
      }
      /**
       * check sms notification
       */
      if (thisUser.notifications.sms) {
        data.phone = thisUser.phone;
      }
    }

    /**
     * Do the actual notification
     * This will be called after populating required fields in the data
     * @param  {Object} fullData Populated object containing actor and user data
     * @return {Void}
     */
    function doNotify(fullData) {
      /**
       * Set the notification title & message
       */
      switch (fullData.notificationType) {
        case 'water':
          fullData.title = 'Post Water';
          fullData.message = `${fullData.fromUser.userName} has liked a post`;
          break;

        case 'comment':
          fullData.title = 'Post comment';
          fullData.message = `${fullData.fromUser.userName} has commented on a post`;
          break;

        case 'follow':
          fullData.title = 'User Follow';
          fullData.message = `${fullData.fromUser.userName} is now following you`;
          break;

        case 'mention':
          fullData.title = 'Post Mention';
          fullData.message = `${fullData.fromUser.userName} mentioned you in a post`;
          break;

        case 'feed':
        case 'tagfeed':
          fullData.title = 'New Post';
          fullData.message = `${fullData.fromUser.userName} has a new post`;
          break;

        case 'chatMessage':
          fullData.title = 'Chat Message';
          fullData.message = `${fullData.fromUser.userName} sent you this message: ${(fullData.chatMessage) ? fullData.chatMessage.message : ''}`;
          break;

        default:
          fullData.title = 'invalid';
          fullData.message = 'invalid event';
          break;
      }

      /**
       * Save & sent notification
       */
      const notification = new Notification(fullData);
      notification.save().then(() => {
        /**
         * Check the config to sent notifications
         */
        if (fullData.devices && !fullData.config.avoidPush) {
          notification.sendPush(fullData);
        }
        /**
         * Check the config to sent notifications
         */
        if (fullData.email && !fullData.config.avoidEmail) {
          notification.sendEmail(fullData);
        }
        /**
         * Check the config to sent notifications
         */
        if (fullData.phone && !fullData.config.avoidSms) {
          notification.sendSms(fullData);
        }
      });
    }

    /**
     * Load the user model
     * @type {Object}
     */
    const User = mongoose.model('User');

    /**
     * Populate the actor
     */
    User.findOne({ _id: data.fromUser }).exec((err, fromuser) => {
      data.fromUser = fromuser;
      doNotify(data);
    });
  },

  /**
   * Send a notification to all followers
   * @param  {Object} data   The notification data
   * @param  {Object} System The core system object
   * @return {Void}
   */
  notifyFollowers(data) {
    // loop and notify all the followers
    this.followers.map((follower) => {
      follower.notify(data);
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
