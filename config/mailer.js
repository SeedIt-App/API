const nodemailer = require('nodemailer');
const logger = require('./logger');
const { mail } = require('./vars');
const { merge } = require('lodash');

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport(mail.option);

const mailer = {};

mailer.defaultOptions = {
  from: mail.from,
};

// send mail with defined transport object
mailer.sendMail = ((mailOptions) => {
  // merge the default options to mail
  merge(mailOptions, mailer.defaultOptions);
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return logger.error(error);
    }
    return logger.info('Message sent: %s', info.messageId);
  });
});

module.exports = mailer;
