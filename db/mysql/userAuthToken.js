'use strict';

// Required modules
const reqlib = require('app-root-path').require,
  logger = reqlib('/helpers/logger'),
  MySQLDB = new (reqlib('/db/mysql/mysql'))(),
  getMessage = reqlib('/constants/messages');

// User Auth Token DB related functions
class UserAuthToken {
  constructor() {
    this.tableName = 'user_auth_token';
    this.somethingWrongMsg = getMessage['SOMETHING_WRONG'];
    this.successMsg = getMessage['SUCCESS'];
    this.dataNotFoundMsg = 'User auth token not found';
    this.sqlSelectFields = `id, user_id AS userId, auth_token AS authToken, refresh_token AS refreshToken, 
      jwt_id AS jwtId, source, status, token_expiry AS tokenExpiry, created_date AS createdDate`;
  }

  // Get auth token details by User id
  async getByUserId(inputData) {
    try {
      const { userId } = inputData;

      const selectSqlString = `SELECT ${this.sqlSelectFields}
        FROM \`${this.tableName}\` WHERE user_id = ? LIMIT 1`,
        selectSqlData = [userId],
        getAuthTokenResult = await MySQLDB.preparedQuery(selectSqlString, selectSqlData);
      // Send error message
      if(!getAuthTokenResult || getAuthTokenResult.length === 0 || !getAuthTokenResult[0].id) {
        return { error: true, message: this.dataNotFoundMsg };
      }

      // Token present
      return { error: false, message: this.successMsg, data: { userAuthToken: getAuthTokenResult } };
    }
    catch(e) {
      logger.error(`mysql:userAuthToken getByUserId() function => Error = `, e);
      throw e;
    }
  }

  // Get auth token details by Refresh Token
  async getByRefreshToken(inputData) {
    try {
      const { userId, refreshToken } = inputData;

      const selectSqlString = `SELECT ${this.sqlSelectFields}
        FROM \`${this.tableName}\` WHERE user_id = ? AND refresh_token = ? LIMIT 1`,
        selectSqlData = [userId, refreshToken],
        getAuthTokenResult = await MySQLDB.preparedQuery(selectSqlString, selectSqlData);
      // Send error message
      if(!getAuthTokenResult || getAuthTokenResult.length === 0 || !getAuthTokenResult[0].id) {
        return { error: true, message: this.dataNotFoundMsg };
      }

      // Token present
      return { error: false, message: this.successMsg, data: { userAuthToken: getAuthTokenResult } };
    }
    catch(e) {
      logger.error(`mysql:userAuthToken getByUserId() function => Error = `, e);
      throw e;
    }
  }

  // Insert User auth token
  async insert(inputData) {
    try {
      const { userId, authToken, refreshToken, jwtId, source, tokenExpiry } = inputData;
      let insertId;

      // Check if user token entry already exists
      const getAuthTokenResult = await this.getByUserId({ userId });
      // Auth token not persent in Table for User then Insert new entry for user
      if(getAuthTokenResult.error) {
        // Build Insert Query & Data
        const insertSqlString = `INSERT INTO \`${this.tableName}\` 
          (user_id, auth_token, refresh_token, jwt_id, source, token_expiry) VALUES(?,?,?,?,?,?)`;
        const insertSqlData = [ userId, authToken, refreshToken, jwtId, source, tokenExpiry ];

        // Insert into table
        const insertResult = await MySQLDB.preparedQuery(insertSqlString, insertSqlData);
        if(!insertResult) {
          return { error: true, message: 'Unable to create Auth token' };
        }

        // Inserted Id
        insertId = insertResult.insertId;
      }
      // Already present then update token
      else {
        // Build Update Query & Data
        const updateSqlString = `UPDATE \`${this.tableName}\` SET auth_token = ?, refresh_token = ?, jwt_id = ?,
          source = ?, token_expiry = ?, status = ? WHERE user_id = ?`;
        const updateSqlData = [ authToken, refreshToken, jwtId, source, tokenExpiry, 'A', userId ];

        // Update record
        const updateResult = await MySQLDB.preparedQuery(updateSqlString, updateSqlData);
        if(!updateResult) {
          return { error: true, message: 'Unable to create Auth token' };
        }

        // Set insert id
        insertId = getAuthTokenResult.data.userAuthToken[0].id;
      }

      // Send back Success response
      return {
        error: false,
        message: 'User auth token inserted',
        data: { insertId }
      };
    }
    catch(e) {
      logger.error(`mysql:userAuthToken insert() function => Error = `, e);
      throw e;
    }
  }

  // Delete User auth token
  async delete(inputData) {
    try {
      const { userId } = inputData;

      // Build Update Query & Data
      const updateSqlString = `UPDATE \`${this.tableName}\` SET auth_token = ?, refresh_token = ?, 
        jwt_id = ?, source = ?, status = ? WHERE user_id = ?`;
      const updateSqlData = [ '', '', '', 0, 'I', userId ];

      // Update record
      const updateResult = await MySQLDB.preparedQuery(updateSqlString, updateSqlData);
      if(!updateResult) {
        return { error: true, message: 'Unable to delete Auth token' };
      }

      // Send back Success response
      return {
        error: false,
        message: 'User auth token deleted',
        data: {}
      };
    }
    catch(e) {
      logger.error(`mysql:userAuthToken delete() function => Error = `, e);
      throw e;
    }
  }
}

module.exports = UserAuthToken;