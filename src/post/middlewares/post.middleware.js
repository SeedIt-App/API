/**
 * TODO: get loggedin user location
 * @param {*} req   request object
 * @param {*} res   response object
 * @param {*} next  next callback function
 */
exports.location = (req, res, next) => {
  req.location = {};
  return next();
};
