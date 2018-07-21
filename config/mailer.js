const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const logger = require('./logger');
const { mail } = require('./vars');
const { merge } = require('lodash');
let transporter = {};

if (mail.option.host === 'SENDGRID') {
  transporter = nodemailer.createTransport(sgTransport({
    auth: {
      api_user: mail.option.auth.user,
      api_key: mail.option.auth.pass,
    },
  }));
} else {
  // create reusable transporter object using the default SMTP transport
  transporter = nodemailer.createTransport(mail.option);
}

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
