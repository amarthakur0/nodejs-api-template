'use strict';

// Required modules
const mongoose = require('mongoose'),
  config = require('config'),
  appRoot = require('app-root-path'),
  reqlib = appRoot.require,
  logger = reqlib('/helpers/logger');

// Mongo class
class MongoDB {

  constructor() {}

  // Connect to db
  // Return = [false - not connected, true - connected]
  async connectDB() {
    try {
      // First time connection
      if(!mongoose.connection.readyState) {
        const mongoConfig = config.get('mongo'),
          uri = mongoConfig.uri,
          options = {
            user: mongoConfig.user,
            pass: mongoConfig.password,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            poolSize: mongoConfig.poolSize
          };
        
        // Connect Mongo
        await mongoose.connect(uri, options);

        // On successful connection
        mongoose.connection.on('connected', () => {
          logger.info('Mongo connection successful');
        });
        
        // On Error
        mongoose.connection.on('error', (e) => {
          logger.error('Mongo connection error - ', e);
        });
        
        // On disconnect
        mongoose.connection.on('disconnected', () => {
          logger.info('Mongo connection disconnected');
        });
      }

      return true;
    }
    catch(e) {
      logger.error(`MongoDB:connectDB() function => Error = `, e);
      throw e;
    }
  }

  // Close connection
  async closeConnection() {
    try {
      // Close
      if(mongoose.connection) await mongoose.connection.close();

      // Success
      return true;
    }
    catch(e) {
      logger.error(`MongoDB:closeConnection() function => Error = `, e);
      throw e;
    }
  }

  // Get New Object Id
  getObjectId() {
    try {
      return new mongoose.Types.ObjectId;
    }
    catch(e) {
      logger.error(`MongoDB:getObjectId() function => Error = `, e);
      throw e;
    }
  }
}

module.exports = MongoDB;