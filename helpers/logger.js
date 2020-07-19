'use strict';

// Required modules
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const DailyRotateFile = require('winston-daily-rotate-file'),
  appRoot = require('app-root-path'),
  logDir = appRoot + '/logs/';

// custom print to file
const customPrint = printf(({ label, level, message, stack, timestamp }) => {
  return JSON.stringify({ level, timestamp, label, message, stack });
});

// custom format change
const customFormat = () => {
  const replaceError = ({ label, level, message, stack }) => ({ label, level, message, stack });
  const replacer = (key, value) => value instanceof Error ? replaceError(value) : value;
  return combine(timestamp(), label({ label: 'NODE-APP' }), format.json({ replacer }), customPrint);
};

// for info
const infoFileOptions = {
  level: 'info',
  filename: logDir + 'info-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxFiles: '30d'
};
// for error
const errorFileOptions = {
  level: 'error',
  filename: logDir + 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxFiles: '30d'
};

// create winston logger
const logger = createLogger({
  format: customFormat(),
  transports: [
    new DailyRotateFile(infoFileOptions),
    new DailyRotateFile(errorFileOptions)
  ]
});

// If we're not in production then log to the `console` with the format:
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.simple()
  }));
}

module.exports = logger;