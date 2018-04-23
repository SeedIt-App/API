const path = require('path');
const httpStatus = require('http-status');

const APIError = require(path.resolve('./src/api/utils/APIError'));
const Post = require('../models/post.model');

/**
 * Returns jwt token if registration was successful
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const post = await (new Post(req.body)).save();
    const postTransformed = post.transform();
    res.status(httpStatus.CREATED);
    return res.json(postTransformed);
  } catch (error) {
    throw new APIError({
      message: 'Post not created',
      status: httpStatus.BAD_REQUEST,
    });
  }
};
