const Notification = require('../models/notification.model');
// const NotificationEvent = require('../events/notification.event');

/**
 * Load notification and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
  try {
    const notification = await Notification.get(id);
    req.locals = { notification };
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Notification list of user loggedin
 * @param {*} req
 * @param {*} res
 * @param {*} next Next function
 */
exports.list = async (req, res, next) => {
  try {
    // take the count by filter queries
    const count = await Notification.count(req.query.filter);
    const notifications = await Notification.list(req.query);
    res.json({
      count,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};
