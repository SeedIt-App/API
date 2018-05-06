const OneSignal = require('onesignal-node');
const { onesignal } = require('./vars');
const logger = require('./logger');

// create a OneSingal Client for push notification
const singalObj = new OneSignal.Client(onesignal);

const notifier = {};

notifier.sendNotification = (data) => {
  // create notification object to send
  const notificationObj = new OneSignal.Notification({
    contents: {
      en: data.message,
    },
  });
  notificationObj.setParameter('headings', { en: data.title });

  if (data.devices.length === 0) {
    logger.info('** NOTIFICATION ERROR **');
    logger.info('No devices found');
    return true;
  }

  // include player ids in traget devices
  notificationObj.setTargetDevices(data.devices);

  // send this notification to All Users except Inactive ones
  singalObj.sendNotification(notificationObj, (err, httpResponse, res) => {
    if (err) {
      logger.error('** NOTIFICATION ERROR **');
      logger.error(err);
    } else {
      logger.info('** NOTIFICATION SUCCESS **');
      logger.info(res);
      logger.info(httpResponse.statusCode);
    }
  });
};

module.exports = notifier;
