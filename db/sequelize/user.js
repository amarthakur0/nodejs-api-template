'use strict';

// Required modules
const reqlib = require('app-root-path').require,
  logger = reqlib('/helpers/logger'),
  getMessage = reqlib('/constants/messages'),
  getErrorCode = reqlib('/constants/errorCodes'),
  SequelizeConn = new (reqlib('/db/sequelize/sequelize'))(),
  UserAuthToken = reqlib('/db/sequelize/userAuthToken');
const { generateHash, getCurrentTimestamp } = reqlib('/helpers/common');
const { generateAuthToken } = reqlib('/helpers/auth');

// User Table related functions
class User {
  constructor() {
    this.UserSchema = SequelizeConn.getSequelizeSchema().User;
    this.somethingWrongMsg = getMessage['SOMETHING_WRONG'];
    this.successMsg = getMessage['SUCCESS'];
    this.dataNotFoundMsg = 'User not found';
    this.dataNotFoundErrorCode = getErrorCode['DATA_NOT_FOUND'];
    this.sqlSelectFields = ['userId', 'username', 'emailId', 'mobileNo', 'displayName', 'createdDate'];
  }

  // Get User details by User Id
  async getByUserId(inputData) {
    try {
      const { userId } = inputData;

      // Get user from DB
      const userResult = await this.UserSchema.findOne({
        attributes: this.sqlSelectFields,
        where: { userId, status: 'A' }
      });
      // Send error message
      if(!userResult || !(userResult instanceof this.UserSchema) || !userResult.userId) {
        return { error: true, errorCode: this.dataNotFoundErrorCode, message: this.dataNotFoundMsg };
      }

      // User present
      return { error: false, message: 'User found', data: { user: [userResult] } };
    }
    catch(e) {
      logger.error(`sequelize:user getByUserId() function => Error = `, e);
      throw e;
    }
  }

  // Get User details from Username
  async getUserByUsername(inputData) {
    try {
      const { username } = inputData;

      // Get user from DB
      const userResult = await this.UserSchema.findOne({
        attributes: this.sqlSelectFields.concat(['password', 'status']),
        where: { username }
      });
      // Send error message
      if(!userResult || !(userResult instanceof this.UserSchema) || !userResult.userId) {
        return { error: true, errorCode: this.dataNotFoundErrorCode, message: this.dataNotFoundMsg };
      }

      // User present
      return { error: false, message: 'User found', data: { user: [userResult] } };
    }
    catch(e) {
      logger.error(`sequelize:user getUserByUsername() function => Error = `, e);
      throw e;
    }
  }

  // Get All Users
  async getAll(inputData = {}) {
    try {
      // Get all active Users from DB
      const userResult = await this.UserSchema.findAll({
        attributes: this.sqlSelectFields,
        where: { status: 'A' }
      });
      // Send error message
      if(!userResult || userResult.length === 0) {
        return { error: true, errorCode: this.dataNotFoundErrorCode, message: this.dataNotFoundMsg };
      }

      // User present
      return { error: false, message: 'User found', data: { user: userResult } };
    }
    catch(e) {
      logger.error(`sequelize:user getActive() function => Error = `, e);
      throw e;
    }
  }

  // Insert User
  async insert(inputData) {
    try {
      let { username, displayName, emailId, mobileNo, password } = inputData;

      // Check if Username already present in Table
      const usernameCheckResult = await this.getUserByUsername({ username });
      // Send error message if user is found
      if(!usernameCheckResult.error && usernameCheckResult.data.user.length > 0) {
        return { error: true, message: 'Username already exists' };
      }

      // Check if Email Id already present in Table
      const emailIdCheckResult = await this.UserSchema.findOne({
        attributes: ['userId'],
        where: { emailId }
      });
      // Send error message
      if(emailIdCheckResult && emailIdCheckResult instanceof this.UserSchema && emailIdCheckResult.userId > 0) {
        return { error: true, message: 'Email id already exists' };
      }

      // Convert password to md5 hash
      password = generateHash(password);

      // Insert into table
      const insertResult = await this.UserSchema.create({
        username, displayName, emailId, mobileNo, password,
        status: 'A', createdBy: 0
      });
      if(!insertResult) {
        return { error: true, message: 'Unable to create User' };
      }

      // Inserted Id
      const insertId = insertResult.id;

      // Send back Success response
      return {
        error: false,
        message: 'User created',
        data: { insertId }
      };
    }
    catch(e) {
      logger.error(`sequelize:user insert() function => Error = `, e);
      throw e;
    }
  }

  // Update User details
  async update(inputData) {
    try {
      const { userId, displayName, mobileNo, loggedInUserId } = inputData;

      // Check if User present in Table
      const userCheckResult = await this.getByUserId({ userId });
      if(userCheckResult.error) return userCheckResult;

      // Update record
      const updateResult = await this.UserSchema.update(
        { displayName, mobileNo, modifiedBy: loggedInUserId, modifiedDate: getCurrentTimestamp() },
        { where: { userId } }
      );
      if(!updateResult) {
        return { error: true, message: 'Unable to update User' };
      }

      // Send back Success response
      return {
        error: false,
        message: 'User updated',
        data: {}
      };
    }
    catch(e) {
      logger.error(`sequelize:user update() function => Error = `, e);
      throw e;
    }
  }

  // Delete or deactivate User
  async delete(inputData) {
    try {
      const { userId, loggedInUserId } = inputData;

      // Check if User present in Table
      const userCheckResult = await this.getByUserId({ userId });
      if(userCheckResult.error) return userCheckResult;

      // Update record
      const updateResult = await this.UserSchema.update(
        { status: 'I', modifiedBy: loggedInUserId, modifiedDate: getCurrentTimestamp() },
        { where: { userId } }
      );
      if(!updateResult) {
        return { error: true, message: 'Unable to delete User' };
      }

      // Send back Success response
      return {
        error: false,
        message: 'User deleted',
        data: {}
      };
    }
    catch(e) {
      logger.error(`sequelize:user delete() function => Error = `, e);
      throw e;
    }
  }

  // Login user
  async login(inputData) {
    try {
      let { username, password, source } = inputData;
      source = parseInt(source, 10);

      // Convert password to md5 hash
      password = generateHash(password);

      // Get user details by username
      const userResultFull = await this.getUserByUsername({ username });
      // Username not found
      if(userResultFull.error) {
        return { error: true, message: this.dataNotFoundMsg };
      }
      // Set first result
      const userResult = Object.assign({}, userResultFull.data.user[0].dataValues);

      // Check if user is already deleted
      if(userResult.status !== 'A') {
        return { error: true, message: 'User account disabled' };
      }

      // Check for password match
      if(password !== userResult.password) {
        return { error: true, message: 'Password mismatch' };
      }

      // Generate JWT Auth token
      const userId = userResult.userId;
      const { authToken, refreshToken, jwtId, tokenExpiry } = await generateAuthToken({ userId, source });

      // Insert auth token to db
      const authTokenObj = new UserAuthToken();
      const insertAuthTokenResult = await authTokenObj.insert({
        userId, authToken, refreshToken, jwtId, tokenExpiry, source
      });
      if(insertAuthTokenResult.error) {
        return insertAuthTokenResult;
      }

      // Update last login time for User
      // Suppress error & log to file
      try {
        await this.UserSchema.update(
          { lastLoginTime: getCurrentTimestamp() },
          { where: { userId } }
        );
      }
      catch(e) {
        logger.error(`sequelize:user login() function, Update last login time => Error = `, e);
      }

      // Delete password & status from user result
      delete userResult.password;
      delete userResult.status;
      
      // success
      return {
        error: false,
        message: 'Login success',
        data: {
          user: userResult,
          authToken,
          refreshToken
        }
      };
    }
    catch(e) {
      logger.error(`sequelize:user login() function => Error = `, e);
      throw e;
    }
  }

  // Logout user
  async logout(inputData) {
    try {
      const authTokenObj = new UserAuthToken();
      return authTokenObj.delete(inputData);
    }
    catch(e) {
      logger.error(`sequelize:user logout() function => Error = `, e);
      throw e;
    }
  }

  // Generate new Auth token by validating refresh token
  async generateRefreshToken(inputData) {
    try {
      let { userId, refreshToken: oldRefreshToken } = inputData;

      // Check if refresh token present in DB
      const authTokenObj = new UserAuthToken();
      const getAuthTokenResult = await authTokenObj.getByRefreshToken({ userId, refreshToken: oldRefreshToken });
      // Not present then send error
      if(getAuthTokenResult.error || getAuthTokenResult.data.userAuthToken.length === 0) {
        return { error: true, message: 'Refresh token not mapped with User' };
      }

      // Generate JWT Auth token
      const source = getAuthTokenResult.data.userAuthToken[0].source || 1;
      const { authToken, refreshToken, jwtId, tokenExpiry } = await generateAuthToken({ userId, source });

      // Insert auth token to db
      const insertAuthTokenResult = await authTokenObj.insert({
        userId, authToken, refreshToken, jwtId, tokenExpiry, source
      });
      if(insertAuthTokenResult.error) {
        return insertAuthTokenResult;
      }

      // success
      return {
        error: false,
        message: 'Auth Token refreshed',
        data: {
          authToken,
          refreshToken
        }
      };
    }
    catch(e) {
      logger.error(`sequelize:user generateRefreshToken() function => Error = `, e);
      throw e;
    }
  }
}

module.exports = User;