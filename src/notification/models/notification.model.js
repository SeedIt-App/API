// following you
// mentioned you in post
// you following created new post
// created new post on tag
// commented on the post
// watered your post
const path = require('path');
const mongoose = require('mongoose');
const notifier = require(path.resolve('./config/notifier'));
const mailer = require(path.resolve('./config/mailer'));
const NotificationSchema = require('./schema/notification.schema');

/**
 * Methods
 */
NotificationSchema.method({
  /**
   * Push notification
   */
  sendPush(data) {
    notifier.sendNotification({
      title: data.title,
      message: data.message,
      devices: data.devices,
    });
  },

  /**
   * Mail notification
   */
  sendEmail(data) {
    mailer.sendMail({
      from: data.fromUser.email,
      to: data.toUser.email,
      subject: data.title,
      text: data.message,
      html: data.message,
    });
  },

  /**
   * SMS notification
   */
  sendSms() {

  },
});

/**
 * Notification Static functions
 */
NotificationSchema.statics = {
  /**
   * List notifications in descending order of 'createdAt' timestamp.
   *
   * @param {Object} query - request query params
   * @returns {Promise<User[]>}
   */
  list(query) {
    return this.find(query.filter)
      .select(query.select)
      .sort(query.sortBy)
      .skip(query.perPage * (query.page - 1))
      .limit(query.perPage)
      .exec();
  },
};

/**
 * @typedef Notification
 */
module.exports = mongoose.model('Notification', NotificationSchema);
