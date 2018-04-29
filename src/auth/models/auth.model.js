const path = require('path');
const mongoose = require('mongoose');
const crypto = require('crypto');
const moment = require('moment-timezone');
const jwt = require('jwt-simple');
const AuthSchema = require('./schema/auth.schema');
const { jwtSecret, jwtExpirationInterval } = require(path.resolve('./config/vars'));

/**
 * Auth object methods
 */
AuthSchema.statics = {

  /**
   * Generate user access token
   *
   * @param {User} user
   * @returns {accessToken}
   */
  accessToken(user) {
    const playload = {
      exp: moment().add(jwtExpirationInterval, 'minutes').unix(),
      iat: moment().unix(),
      sub: user._id,
    };
    return jwt.encode(playload, jwtSecret);
  },

  /**
   * Generate a refresh token object and saves it into the database
   *
   * @param {User} user
   * @returns {refreshToken}
   */
  refreshToken(user) {
    const userId = user._id;
    const userEmail = user.email;
    const refreshToken = `${userId}.${crypto.randomBytes(40).toString('hex')}`;
    const expires = moment().add(30, 'days').toDate();
    const tokenObject = new this({
      refreshToken, userId, userEmail, expires,
    });
    tokenObject.save();
    return tokenObject.refreshToken;
  },

};

/**
 * @typedef AuthSchema
 */
module.exports = mongoose.model('Auth', AuthSchema);
