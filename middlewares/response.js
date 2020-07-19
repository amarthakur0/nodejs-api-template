'use strict';

// Required modules
const reqlib = require('app-root-path').require,
  logger = reqlib('/helpers/logger'),
  config = require('config'),
  DEBUG = config.get('debug');

// Send response to recipient
const sendResponse = (req, res, next) => {
  const {response, statusCode} = res.locals._TMP;

  // display logs
  if(DEBUG) {
    logger.info('========================================');
    logger.info(`API = ${req.originalUrl}, Request IP = ${req._clientIpAddress}, Status Code = ${statusCode}, Response = ${JSON.stringify(response)}`);
    logger.info('========================================');
  }

  return res.status(statusCode).send(response);
};

module.exports = sendResponse;