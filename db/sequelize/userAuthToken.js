'use strict';

// Required modules
const reqlib = require('app-root-path').require,
  logger = reqlib('/helpers/logger'),
  SequelizeConn = new (reqlib('/db/sequelize/sequelize'))(),
  getMessage = reqlib('/constants/messages');

// User Auth Token DB related functions
class UserAuthToken {
  constructor() {
    this.UserAuthTokenSchema = SequelizeConn.getSequelizeSchema().UserAuthToken;
    this.somethingWrongMsg = getMessage['SOMETHING_WRONG'];
    this.successMsg = getMessage['SUCCESS'];
    this.dataNotFoundMsg = 'User auth token not found';
    this.sqlSelectFields = ['id', 'userId', 'authToken', 'refreshToken', 
      'jwtId', 'source', 'status', 'tokenExpiry', 'createdDate'];
  }

  // Get auth token details by User id
  async getByUserId(inputData) {
    try {
      const { userId } = inputData;

      const getAuthTokenResult = await this.UserAuthTokenSchema.findOne({
        attributes: this.sqlSelectFields,
        where: { userId }
      });
      // Send error message
      if(!getAuthTokenResult || !(getAuthTokenResult instanceof this.UserAuthTokenSchema) || !getAuthTokenResult.id) {
        return { error: true, message: this.dataNotFoundMsg };
      }

      // Token present
      return { error: false, message: this.successMsg, data: { userAuthToken: [getAuthTokenResult] } };
    }
    catch(e) {
      logger.error(`sequelize:userAuthToken getByUserId() function => Error = `, e);
      throw e;
    }
  }

  // Get auth token details by Refresh Token
  async getByRefreshToken(inputData) {
    try {
      const { userId, refreshToken } = inputData;

      const getAuthTokenResult = await this.UserAuthTokenSchema.findOne({
        attributes: this.sqlSelectFields,
        where: { userId, refreshToken }
      });
      // Send error message
      if(!getAuthTokenResult || !(getAuthTokenResult instanceof this.UserAuthTokenSchema) || !getAuthTokenResult.id) {
        return { error: true, message: this.dataNotFoundMsg };
      }

      // Token present
      return { error: false, message: this.successMsg, data: { userAuthToken: [getAuthTokenResult] } };
    }
    catch(e) {
      logger.error(`sequelize:userAuthToken getByUserId() function => Error = `, e);
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
        // Insert into table
        const insertResult = await this.UserAuthTokenSchema.create({
          userId, authToken, refreshToken, jwtId, source, tokenExpiry
        });
        if(!insertResult) {
          return { error: true, message: 'Unable to create Auth token' };
        }

        // Inserted Id
        insertId = insertResult.id;
      }
      // Already present then update token
      else {
        // Update record
        const updateResult = await this.UserAuthTokenSchema.update(
          { authToken, refreshToken, jwtId, source, tokenExpiry, status: 'A' },
          { where: { userId } }
        );
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
      logger.error(`sequelize:userAuthToken insert() function => Error = `, e);
      throw e;
    }
  }

  // Delete User auth token
  async delete(inputData) {
    try {
      const { userId } = inputData;

      // Update record
      const updateResult = await this.UserAuthTokenSchema.update(
        { authToken: '', refreshToken: '', jwtId: '', source: 0, status: 'I' },
        { where: { userId } }
      );
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
      logger.error(`sequelize:userAuthToken delete() function => Error = `, e);
      throw e;
    }
  }
}

module.exports = UserAuthToken;