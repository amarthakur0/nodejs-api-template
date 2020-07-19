'use strict';

// Required modules
const { Sequelize } = require('sequelize'),
  config = require('config'),
  fs = require('fs'),
  path = require('path'),
  basename = path.basename(__filename),
  appRoot = require('app-root-path'),
  reqlib = appRoot.require,
  logger = reqlib('/helpers/logger');

// Sequelize class
class SequelizeConn {

  constructor() {}

  // Connect to db
  // Return = [false - not connected, true - connected]
  async connectDB() {
    try {
      // First time connection
      if(!SequelizeConn.sequelize) {
        // Get MySQL config details
        const mysqlConfig = config.get('mysql'),
          host = mysqlConfig.host,
          port = mysqlConfig.port,
          user = mysqlConfig.user,
          password = mysqlConfig.password,
          database = mysqlConfig.database;

        // Check if MySQL config is present
        if(!host || !user || !database) {
          logger.error(`SequelizeConn:connectDB() function => Error = MySQL config not found`);
          return false;
        }

        // Create connection
        const sequelize = new Sequelize(database, user, password, {
          host: host,
          port: port || 3306,
          logging: false,
          dialect: 'mysql',
          pool: {
            max: mysqlConfig.connectionLimit || 10,
            min: 0,
            acquire: 30000,
            idle: 10000
          },
          timezone: mysqlConfig.timezone || '+05:30'
        });

        // Check if connection is established
        await sequelize.authenticate();

        // Save sequelize connection
        SequelizeConn.sequelize = sequelize;

        // Import all models
        this.importSchema();
      }

      // On connection success
      return true;
    }
    catch(e) {
      logger.error(`SequelizeConn:connectDB() function => Error = `, e);
      throw e;
    }
  }

  // Close connection
  async closeConnection() {
    try {
      // Close
      if(SequelizeConn.sequelize) await SequelizeConn.sequelize.close();

      // Set to null
      SequelizeConn.sequelize = null;

      // Success
      return true;
    }
    catch(e) {
      logger.error(`SequelizeConn:closeConnection() function => Error = `, e);
      throw e;
    }
  }

  // Import all schema / models
  importSchema() {
    try {
      const schemaFolder = appRoot + '/db/sequelize/schema/';
      SequelizeConn.schema = {};

      // Import all
      fs
        .readdirSync(schemaFolder)
        .filter(file => {
          return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
        })
        .forEach(file => {
          const schema = require(path.join(schemaFolder, file))(SequelizeConn.sequelize);
          SequelizeConn.schema[schema.name] = schema;
        });
    }
    catch(e) {
      logger.error(`SequelizeConn:importSchema() function => Error = `, e);
      throw e;
    }
  }

  // Get sequelize connection
  getSequelizeConn() {
    return SequelizeConn.sequelize;
  }

  // Get sequelize schema / models
  getSequelizeSchema() {
    return SequelizeConn.schema;
  }
}

module.exports = SequelizeConn;