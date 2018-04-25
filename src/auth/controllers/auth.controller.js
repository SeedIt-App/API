const path = require('path');
const httpStatus = require('http-status');
const Auth = require('../models/auth.model');
const moment = require('moment-timezone');

const User = require(path.resolve('./src/user/models/user.model'));
const { jwtExpirationInterval } = require(path.resolve('./config/vars'));

/**
* Returns a formated object with tokens
* @private
*/
function generateTokenResponse(user, accessToken) {
  const tokenType = 'Bearer';
  const refreshToken = Auth.generate(user);
  const expiresIn = moment().add(jwtExpirationInterval, 'minutes');
  return {
    tokenType, accessToken, refreshToken, expiresIn,
  };
}

/**
 * Returns jwt token if registration was successful
 * @public
 */
exports.register = async (req, res, next) => {
  try {
    req.body.serviceProvider = 'local';
    const user = await (new User(req.body)).save();
    const userTransformed = user.transform();
    res.status(httpStatus.CREATED);
    return res.json({
      status: 'success',
      data: { user: userTransformed },
    });
  } catch (error) {
    return next(User.checkDuplicateEmail(error));
  }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.login = async (req, res, next) => {
  try {
    const { user, accessToken } = await User.findAndGenerateToken(req.body);
    const token = generateTokenResponse(user, accessToken);
    const userTransformed = user.transform();
    return res.json({ token, user: userTransformed });
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
    const { user } = req.body;
    // check the user object already in db
    const userObj = await User.find({
      serviceProvider: user.serviceProvider,
      email: user.email,
    });
    // response
    let response = {};
    // check the userObj is valid
    if (userObj) {
      const accessToken = userObj.token();
      const token = generateTokenResponse(userObj, accessToken);
      const userTransformed = userObj.transform();
      response = { token, userObj: userTransformed };
    } else {
      const newUser = await (new User(req.body)).save();
      const userTransformed = newUser.transform();
      res.status(httpStatus.CREATED);
      response = { user: userTransformed };
    }
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

exports.oAuthResponse = (req, res) => res.json({ user: res.user });

/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
exports.refresh = async (req, res, next) => {
  try {
    const { email, refreshToken } = req.body;
    // get the refresh token
    const refreshObject = await Auth.findOneAndRemove({
      userEmail: email,
      refreshToken,
    });

    // get the access token
    const { user, accessToken } = await User.findAndGenerateToken({
      usernameOrEmail: email,
      refreshObject,
    });
    // generate the token response
    const response = generateTokenResponse(user, accessToken);
    // return the response
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};
