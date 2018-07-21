const path = require('path');

// import .env variables
require('dotenv-safe').load({
  path: path.resolve('./.env'),
  sample: path.resolve('./.env.example'),
});

module.exports = {
  env: process.env.NODE_ENV,
  url: 'http://localhost:5000/reset',
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpirationInterval: process.env.JWT_EXPIRATION_MINUTES,
  activateExpirationInterval: process.env.ACTIVATE_EXPIRATION_MINUTES,
  resetExpireInterval: process.env.RESET_EXPIRATION_MINUTES,
  mongo: {
    uri: process.env.NODE_ENV === 'test'
      ? process.env.MONGO_URI_TESTS
      : process.env.MONGO_URI,
  },
  log: {
    format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    level: process.env.LOG_LEVEL,
    file: process.env.LOG_FILE,
  },
  mail: {
    from: process.env.MAIL_FROM,
    option: {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    },
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_PHONE_NUMBER,
  },
  onesignal: {
    userAuthKey: process.env.ONESIGNAL_USER_KEY,
    app: {
      appAuthKey: process.env.ONESIGNAL_APP_KEY,
      appId: process.env.ONESIGNAL_APP_ID,
    },
  },
  aws: {
    s3Bucket: process.env.AWS_S3_BUCKET,
    s3Region: process.env.AWS_S3_REGION,
    expires: process.env.AWS_S3_EXPIRES,
  },
};
