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
 * @typedef Notification
 */
module.exports = mongoose.model('Notification', NotificationSchema);
