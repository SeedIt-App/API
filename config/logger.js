const winston = require('winston');
const { env, log } = require('./vars');

const logger = new (winston.Logger)({
  level: log.level,
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({ filename: log.file }),
  ],
});

// remove console log for production
if (env !== 'development') {
  logger.remove(winston.transports.Console);
}

/**
 * The format & options to use with morgan logger
 *
 * Returns a log.options object with a writable stream based on winston
 * file logging transport (if available)
 */
logger.morganLogOptions = {
  stream: {
    write: (msg) => {
      logger.info(msg);
    },
  },
};

logger.morganLogFormat = log.format ? log.format.toString() : 'combined';

module.exports = logger;
