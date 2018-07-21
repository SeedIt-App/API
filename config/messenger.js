const Twilio = require('twilio');
const logger = require('./logger');
const { twilio } = require('./vars');

// Create a new REST API client to make authenticated requests against the
const client = new Twilio(twilio.accountSid, twilio.authToken);

const messenger = {};

// options = {
//   to:'+16512223344',
//   from:'TWILIO_NUMBER',
//   body:'ahoy hoy! Testing Twilio and node.js'
// }

messenger.send = (options) => {
  options.from = twilio.from;
  client.messages.create(options, (error, message) => {
    if (error) {
      logger.error('--MESSENGER FAILED--');
      return logger.error(error);
    }
    return logger.info(`--MESSENGER SUCCESS--, ${message.sid}`);
  });
};

module.exports = messenger;
