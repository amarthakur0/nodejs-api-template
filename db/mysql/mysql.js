'use strict';

// Required modules
const mysql = require('mysql2'),
  config = require('config'),
  appRoot = require('app-root-path'),
  reqlib = appRoot.require,
  logger = reqlib('/helpers/logger'),
  exec = require('child_process').exec,
  spawn = require('child_process').spawn,
  fs = require('fs'),
  util = require('util'),
  fsStat = util.promisify(fs.stat),
  dbDumpDir = appRoot + '/db_dump/';
const { formatDate } = reqlib('/helpers/common');

// MySQL class
class MySQLDB {

  constructor() {}

  // Connect to db
  // Return = [false - not connected, true - connected]
  async connectDB() {
    try {
      // First time connection
      if(!MySQLDB.connectionPool) {
        // Get MySQL config details
        const mysqlConfig = config.get('mysql'),
          host = mysqlConfig.host,
          port = mysqlConfig.port,
          user = mysqlConfig.user,
          password = mysqlConfig.password,
          database = mysqlConfig.database;
      
        // Check if MySQL config is present
        if(!host || !user || !database) {
          logger.error(`mysql:connectDB() function => Error = MySQL config not found`);
          return false;
        }

        // Create the connection pool
        const pool = mysql.createPool({
          host,
          user,
          password,
          database,
          port: port || 3306,
          waitForConnections: true,
          connectionLimit: mysqlConfig.connectionLimit || 10,
          queueLimit: 0,
          multipleStatements: true
        });

        // check db connection first
        const connectionStatus = await this.checkConnection(pool);
        // db not connected
        if(!connectionStatus) {
          return false;
        }
       
        // Promise wrapped instance of pool
        MySQLDB.connectionPool = pool.promise();
      }

      return true;
    }
    catch(e) {
      logger.error(`mysql:connectDB() function => Error = `, e);
      throw e;
    }
  }

  // Check whether DB has connected properly or not
  // Return = [false - not connected, true - connected]
  checkConnection(pool) {
    return new Promise((resolve, reject) => {
      pool.getConnection((e, connection) => {
        // not connected!
        if(e) {
          logger.error(`mysql:checkConnection() function => Error = `, e);
          return resolve(false);
        }

        // release connection to pool
        pool.releaseConnection(connection);

        return resolve(true);
      });
    });
  }

  // Close all connections
  async closePool() {
    try {
      // End
      if(MySQLDB.connectionPool) await MySQLDB.connectionPool.end();

      // Set to null
      MySQLDB.connectionPool = null;

      return true;
    }
    catch(e) {
      logger.error(`mysql:closePool() function => Error = `, e);
      throw e;
    }
  }

  // Get all connected connection pool list
  getConnectionPool() {
    return MySQLDB.connectionPool;
  }

  // This will be direct raw sql query
  async query(sqlstring) {
    try {
      const [rows, fields] = await MySQLDB.connectionPool.query(sqlstring);
      return rows;
    }
    catch(e) {
      logger.error(`mysql:query() function => SQL Query = ${sqlstring}, Error = `, e);
      throw e;
    }
  }

  // This will be prepared statement query
  async preparedQuery(sqlstring, data = []) {
    try {
      const [rows, fields] = await MySQLDB.connectionPool.execute(sqlstring, data);
      return rows;
    }
    catch(e) {
      logger.error(`mysql:preparedQuery() function => SQL Query = ${sqlstring}, Error = `, e);
      throw e;
    }
  }

  // Escape value
  escape(value) {
    return MySQLDB.connectionPool.escape(value);
  }

  // Get current timestamp
  getCurrentTimestamp() {
    return formatDate(Date.now(), 'YYYY-MM-DD HH:mm:ss');
  }

  // Check whether database already exists
  // Return = [true - db already exists, false - db not exists]
  async checkIfDatabaseExists(dbName) {
    try {
      const sqlstring = 'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?';
      const result = await this.preparedQuery(sqlstring, [dbName]);
      // not exists
      if(!result || result.length === 0) {
        return false;
      }

      return true;
    }
    catch(e) {
      logger.error(`mysql:checkIfDatabaseExists() function => dbName = ${dbName}, Error = `, e);
      throw e;
    }
  }

  // Create database
  // Return = [true - db creation successfull, false - not successfull]
  async createDatabase(dbName) {
    try {
      const sqlstring = `CREATE DATABASE IF NOT EXISTS \`${dbName}\``;
      const result = await this.query(sqlstring);
      // db creation not done
      if(!result || !result.affectedRows) {
        return false;
      }

      return true;
    }
    catch(e) {
      logger.error(`mysql:createDatabase() function => dbName = ${dbName}, Error = `, e);
      throw e;
    }
  }

  // Drop database
  // Return = [true - db drop successfull, false - not successfull]
  async dropDatabase(dbName) {
    try {
      const sqlstring = `DROP DATABASE IF EXISTS \`${dbName}\``;
      const result = await this.query(sqlstring);
      // db drop not done
      if(!result || !result.affectedRows) {
        return false;
      }

      return true;
    }
    catch(e) {
      logger.error(`mysql:dropDatabase() function => dbName = ${dbName}, Error = `, e);
      throw e;
    }
  }

  // Backup database
  backupDatabase(dbConfig) {
    return new Promise(async (resolve, reject) => {
      const backUpDbName = dbConfig.backUpDbName,
        dumpFileName = `${backUpDbName}.sql`,
        fullFilePath = dbDumpDir + dumpFileName;

      try {
        // check if dump file already exists
        const fileStats = await fsStat(fullFilePath);
        // file found
        if(fileStats) {
          return resolve({'status': true, 'dumpFileName': dumpFileName});
        }
      }
      catch(e) {
        // error only if file not exits then procceed or return error 
        if(e.code !== 'ENOENT') {
          logger.error(`mysql:backupDatabase() function => Error = `, e);
          return resolve({'status': false, 'error': e});
        }
      }

      // write stream for dump file
      const wstream = fs.createWriteStream(fullFilePath);
      // backup table (structure & data) & stored procedures
      const mysqldump = spawn('mysqldump', [
        '-h', dbConfig.host,
        '-P', dbConfig.port,
        '-u', dbConfig.user,
        `-p${dbConfig.password}`,
        '--routines',
        '--no-data',
        backUpDbName
      ]);

      // create backup now
      mysqldump
        .stdout
        .pipe(wstream)
        .on('finish', function () {
          resolve({'status': true, 'dumpFileName': dumpFileName});
        })
        .on('error', function (e) {
          logger.error(`mysql:backupDatabase() function => Error = `, e);
          resolve({'status': false, 'error': e});
        });
    });
  }

  // Restore database
  restoreDatabase(dbConfig) {
    return new Promise((resolve, reject) => {
      // dump file
      const dumpFileName = dbDumpDir + dbConfig.dumpFileName;
      // restore db
      exec(`mysql -u${dbConfig.user} -p${dbConfig.password} -h${dbConfig.host} -P${dbConfig.port} ${dbConfig.dbName} < ${dumpFileName}`, (err, stdout, stderr) => {
        // on error
        if (err) {
          logger.error(`mysql:restoreDatabase() function => Error = `, err);
          return resolve({'status': false, 'error': err});
        }

        // on success
        resolve({'status': true});
      });
    });
  }
}

module.exports = MySQLDB;