const path = require('path');
const httpStatus = require('http-status');
const { omit } = require('lodash');
const User = require('../models/user.model');
const { handler: errorHandler } = require(path.resolve('./src/api/middlewares/error.middleware'));

/**
 * Load user and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
  try {
    const user = await User.get(id);
    req.locals = { user };
    return next();
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

/**
 * Get user
 * @public
 */
exports.get = (req, res) => res.json(req.locals.user.transform());

/**
 * Get logged in user profile
 * @public
 */
exports.profile = (req, res) => res.json(req.user.transform());

/**
 * Get user list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const count = await User.count();
    const users = await User.list(req.query);
    res.json({
      count,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(httpStatus.CREATED);
    res.json(savedUser.transform());
  } catch (error) {
    next(User.checkDuplicateError(error));
  }
};

/**
 * Replace existing user
 * @public
 */
exports.replace = async (req, res, next) => {
  try {
    // deprecated
    if (true) throw new Error('Deprecated function');
    const { user } = req.locals;
    const newUser = new User(req.body);
    const ommitRole = user.role !== 'admin' ? 'role' : '';
    const newUserObject = omit(newUser.toObject(), '_id', ommitRole);

    await user.update(newUserObject, { override: true, upsert: true });
    const savedUser = await User.findById(user._id);

    res.json(savedUser.transform());
  } catch (error) {
    next(User.checkDuplicateError(error));
  }
};

/**
 * Update existing user
 * @public
 */
exports.update = (req, res, next) => {
  const ommitRole = req.locals.user.role !== 'admin' ? 'role' : '';
  const updatedUser = omit(req.body, ommitRole);
  const user = Object.assign(req.locals.user, updatedUser);

  user.save()
    .then(savedUser => res.json(savedUser.transform()))
    .catch(e => next(User.checkDuplicateError(e)));
};

/**
 * Delete user
 * @public
 */
exports.remove = (req, res, next) => {
  const { user } = req.locals;

  user.remove()
    .then(() => res.status(httpStatus.NO_CONTENT).end())
    .catch(e => next(e));
};

/**
 * Follow other users
 * @param {Object} req request object
 * @param {Object} res response object
 * @param {function} next next function
 */
exports.follow = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const followUser = req.locals.user;
    // check the user already following the follow user
    if (currentUser.followings.indexOf(followUser._id) > -1) {
      throw new Error(`You are already following ${followUser.userName}`);
    }
    // push the follow user to followings
    currentUser.followings.push(followUser._id);
    await currentUser.save();
    // add the follower record to follow user
    followUser.followers.push(currentUser._id);
    await followUser.save();

    // notify the follow user for new follower
    followUser.notify({
      fromUser: currentUser._id,
      resource: {
        name: 'user',
        id: currentUser._id,
      },
      notificationType: 'follow',
    });

    // success response
    res.status(httpStatus.OK).send({
      message: `You are now following ${followUser.userName}`,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * User Followers list
 * @param {Object} req request object
 * @param {Object} res response object
 * @param {function} next next function
 */
exports.followers = async (req, res, next) => {
  try {
    const { user } = req;
    // get the total user followers count
    const count = user.followers.length;
    // add the follower query to the filter
    req.query.filter._id = { $in: user.followers };
    // populate followers data from query param
    const followers = await User.find(req.query.filter)
      .select(req.query.select)
      .skip(req.query.perPage * (req.query.page - 1))
      .limit(req.query.perPage)
      .exec();
    // sent the response
    res.json({
      count,
      followers,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * User Followings list
 * @param {Object} req request object
 * @param {Object} res response object
 * @param {function} next next function
 */
exports.followings = async (req, res, next) => {
  try {
    const { user } = req;
    // get the total user followings count
    const count = user.followings.length;
    // add the following query to the filter
    req.query.filter._id = { $in: user.followings };
    // populate followings data from query param
    const followings = await User.find(req.query.filter)
      .select(req.query.select)
      .skip(req.query.perPage * (req.query.page - 1))
      .limit(req.query.perPage)
      .exec();
    // sent the response
    res.json({
      count,
      followings,
    });
  } catch (error) {
    return next(error);
  }
};
