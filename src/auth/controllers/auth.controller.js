const path = require('path');
const httpStatus = require('http-status');
const moment = require('moment-timezone');
const Auth = require('../models/auth.model');
const mailer = require(path.resolve('./config/mailer'));
const User = require(path.resolve('./src/user/models/user.model'));
const { url, jwtExpirationInterval } = require(path.resolve('./config/vars'));

/**
 * Returns jwt token if registration was successful
 * @public
 */
exports.register = async (req, res, next) => {
  try {
    const user = await (new User(req.body)).save();
    const token = this.tokenResponse(user);
    user.transform();
    this.sendRegisterMail(user);
    res.status(httpStatus.CREATED);
    return res.json({ token, user });
  } catch (error) {
    return next(User.checkDuplicateError(error));
  }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.login = async (req, res, next) => {
  try {
    // split the usernameOrEmail from request body
    req.body.userName = req.body.usernameOrEmail;
    req.body.email = req.body.usernameOrEmail;
    // authenticate user
    const user = await User.findByOptions(req.body);
    const token = this.tokenResponse(user);
    user.transform();
    return res.json({ token, user });
  } catch (error) {
    return next(error);
  }
};

/**
 * login with an existing user or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
exports.oAuth = async (req, res, next) => {
  try {
    const { user } = req;
    const token = this.tokenResponse(user);
    const userTransformed = user.transform();
    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
exports.refresh = async (req, res, next) => {
  try {
    const { email, refreshToken } = req.body;
    const refreshObject = await Auth.findOneAndRemove({
      userEmail: email,
      refreshToken,
    });
    const user = await User.findByOptions({ email, refreshObject });
    const response = this.tokenResponse(user);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * Generate reset token and send reset link to users email
 * @public
 */
exports.forgot = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findAndReset(email);
    // sent reset mail
    this.resetMail(user);
    return res.json({ message: 'Password reset link sent to registered email address' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update user password with reset token
 * @public
 */
exports.reset = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    await User.findAndResetPassword(resetToken, newPassword);
    return res.json({ message: 'Password updated successfully, please login with new password' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns a formated object with tokens
 * @private
 */
exports.tokenResponse = (user) => {
  const tokenType = 'Bearer';
  const accessToken = Auth.accessToken(user);
  const refreshToken = Auth.refreshToken(user);
  const expiresIn = moment().add(jwtExpirationInterval, 'minutes');
  return {
    tokenType, accessToken, refreshToken, expiresIn,
  };
};

/**
 * Send welcome mail to registered user
 * @param {Object} user
 */
exports.sendRegisterMail = (user) => {
  // sent user registered welcome mail
  mailer.sendMail({
    to: user.email,
    subject: 'SeedIt welcome mail',
    text: 'seedit welcome mail TODO:// get the mail content',
    html: 'seedit welcome mail TODO:// get the mail content',
  });
};

exports.resetMail = (user) => {
  mailer.sendMail({
    to: user.email,
    subject: 'Reset password link',
    text: `Reset password link ${url}/${user.resetToken}`,
    html: `Reset password link <a href="${url}/${user.resetToken}">click here</a>`,
  });
};
