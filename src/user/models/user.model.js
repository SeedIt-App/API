const path = require('path');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
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
    // update the user data
    await user.save();
    // return the user object
    return user;
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
