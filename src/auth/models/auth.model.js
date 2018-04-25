const mongoose = require('mongoose');
const crypto = require('crypto');
const moment = require('moment-timezone');

const AuthSchema = require('./schema/auth.schema');

AuthSchema.statics = {

  /**
   * Generate a refresh token object and saves it into the database
   *
   * @param {User} user
   * @returns {AuthSchema}
   */
  generate(user) {
    const userId = user._id;
    const userEmail = user.email;
    const refreshToken = `${userId}.${crypto.randomBytes(40).toString('hex')}`;
    const expires = moment().add(30, 'days').toDate();
    const tokenObject = new AuthSchema({
      refreshToken, userId, userEmail, expires,
    });
    tokenObject.save();
    return tokenObject;
  },

};

/**
 * @typedef Auth
 */
const Auth = mongoose.model('Auth', AuthSchema);
module.exports = Auth;
