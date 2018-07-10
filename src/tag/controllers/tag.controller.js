const path = require('path');
const httpStatus = require('http-status');
const Tag = require('../models/tag.model');
const { handler: errorHandler } = require(path.resolve('./src/api/middlewares/error.middleware'));

/**
 * Load tag and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
  try {
    const tag = await Tag.get(id);
    req.locals = { tag };
    return next();
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

/**
 * Get single tag
 * @public
 */
exports.get = (req, res) => {
  // populate the tag with other objects
  req.locals.tag.withPopulate(req.query.with);
  // return the tag data
  return res.json(req.locals.tag);
};

/**
 * Get tag list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    // regex tag name for suggestion
    if (req.query.filter && req.query.filter.tag) {
      req.query.filter.tag = {
        $regex: new RegExp(`^${req.query.filter.tag}`, 'i'),
      };
    }
    const count = await Tag.count();
    const tags = await Tag.list(req.query);
    return res.json({
      count,
      tags,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Create new tag
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    // add tag by user id
    req.body.tagBy = req.user._id;
    // save the new tag
    const tag = new Tag(req.body);
    const savedTag = await tag.save();
    res.status(httpStatus.CREATED);
    res.json(savedTag);
  } catch (error) {
    next(Tag.checkDuplicateError(error));
  }
};

/**
 * Update existing tag
 * @public
 */
exports.update = (req, res, next) => {
  const tag = Object.assign(req.locals.tag, req.body);
  // save & return success response
  tag.save()
    .then(savedTag => res.json(savedTag))
    .catch(e => next(Tag.checkDuplicateError(e)));
};

/**
 * Delete tag
 * @public
 */
exports.remove = (req, res, next) => {
  const { tag } = req.locals;

  tag.remove()
    .then(() => res.status(httpStatus.NO_CONTENT).end())
    .catch(e => next(e));
};

/**
 * Follow other tags
 * @param {Object} req request object
 * @param {Object} res response object
 * @param {function} next next function
 */
exports.follow = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const followTag = req.locals.tag;
    // check the user already following the follow tag
    if (followTag.followers.indexOf(currentUser._id) > -1) {
      throw new Error(`You are already following ${followTag.tag}`);
    }
    // push the current user to tag followers
    followTag.followers.push(currentUser._id);
    await followTag.save();

    // success response
    res.status(httpStatus.OK).send({
      message: `You are now following ${followTag.tag}`,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Tag Followers list
 * @param {Object} req request object
 * @param {Object} res response object
 * @param {function} next next function
 */
exports.followers = async (req, res, next) => {
  try {
    const { tag } = req.locals;
    // get the total tag followers count
    const count = tag.followers.length;
    // populate followers data from query param
    const { followers } = await Tag.findById(tag._id)
      .populate('followers', ['firstName', 'lastName', 'userName', 'email', 'picture'])
      .select('followers')
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
