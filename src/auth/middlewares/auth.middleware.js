const path = require('path');
const _ = require('lodash');
const httpStatus = require('http-status');
const passport = require('passport');
const User = require(path.resolve('./src/user/models/user.model'));
const APIError = require(path.resolve('./src/api/utils/error.utils'));

const ADMIN = 'admin';
const LOGGED_USER = '_loggedUser';

const handleJWT = (req, res, next, roles) => async (err, user, info) => {
  const error = err || info;
  const logIn = Promise.promisify(req.logIn);
  const apiError = new APIError({
    message: error ? error.message : 'Unauthorized',
    status: httpStatus.UNAUTHORIZED,
    stack: error ? error.stack : undefined,
  });

  try {
    if (error || !user) throw error;
    await logIn(user, { session: false });
  } catch (e) {
    return next(apiError);
  }

  if (roles === LOGGED_USER) {
    if (user.role !== 'admin' && req.params.userId !== user._id.toString()) {
      apiError.status = httpStatus.FORBIDDEN;
      apiError.message = 'Forbidden';
      return next(apiError);
    }
  } else if (!roles.includes(user.role)) {
    apiError.status = httpStatus.FORBIDDEN;
    apiError.message = 'Forbidden';
    return next(apiError);
  } else if (err || !user) {
    return next(apiError);
  }

  req.user = user;

  return next();
};

exports.ADMIN = ADMIN;
exports.LOGGED_USER = LOGGED_USER;

exports.authorize = (roles = User.enum.roles) => (req, res, next) =>
  passport.authenticate(
    'jwt', { session: false },
    handleJWT(req, res, next, roles),
  )(req, res, next);

/**
 * oAuth signup handler
 *
 * @param {Object} req request object
 * @param {Object} res response object
 * @param {Function} next Next callback function
 */
exports.oAuth = async (req, res, next) => {
  try {
    // check current user exist in db
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      // check the provider
      if (
        _.filter(existingUser.services, _.matches({
          id: req.body.id, provider: req.body.provider,
        })).length === 0
      ) {
        // push the new provider to user oauth services
        const serviceProfile = _.pick(req.body, ['id', 'provider', '_raw']);
        serviceProfile.accessToken = req.body.accessToken;
        existingUser.services.push(serviceProfile);
        await existingUser.save();
      }
      req.user = existingUser;
      return next();
    }

    // create new user
    const newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      userName: req.body.userName,
      email: req.body.email,
      gender: req.body.gender,
      picture: req.body.photo,
      services: [{
        provider: req.body.provider,
        id: req.body.id,
        accessToken: req.body.accessToken,
        _raw: req.body._raw,
      }],
      activeFlag: true,
    });
    await newUser.save();
    req.user = newUser;
    return next();
  } catch (e) {
    return next(e, false);
  }
};
