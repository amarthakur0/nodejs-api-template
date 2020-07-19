'use strict';

// Required modules
const reqlib = require('app-root-path').require,
  logger = reqlib('/helpers/logger'),
  MySQLDB = new (reqlib('/db/mysql/mysql'))(),
  getMessage = reqlib('/constants/messages'),
  getErrorCode = reqlib('/constants/errorCodes'),
  UserAuthToken = reqlib('/db/mysql/userAuthToken');
const { generateHash } = reqlib('/helpers/common');
const { generateAuthToken } = reqlib('/helpers/auth');

// User Table related functions
class User {
  constructor() {
    this.tableName = 'user';
    this.somethingWrongMsg = getMessage['SOMETHING_WRONG'];
    this.successMsg = getMessage['SUCCESS'];
    this.dataNotFoundMsg = 'User not found';
    this.dataNotFoundErrorCode = getErrorCode['DATA_NOT_FOUND'];
    this.sqlSelectFields = `user_id AS userId, username, email_id AS emailId, 
      mobile_no AS mobileNo, display_name AS displayName`;
  }

  // Get User details by User Id
  async getByUserId(inputData) {
    try {
      const { userId } = inputData;

      // Get user from DB
      const selectSqlString = `SELECT ${this.sqlSelectFields}
        FROM \`${this.tableName}\` 
        WHERE user_id = ? AND status = 'A' LIMIT 1`,
        selectSqlData = [userId],
        userResult = await MySQLDB.preparedQuery(selectSqlString, selectSqlData);
      // Send error message
      if(!userResult || userResult.length === 0 || !userResult[0].userId) {
        return { error: true, errorCode: this.dataNotFoundErrorCode, message: this.dataNotFoundMsg };
      }

      // User present
      return { error: false, message: 'User found', data: { user: [userResult[0]] } };
    }
    catch(e) {
      logger.error(`mysql:user getByUserId() function => Error = `, e);
      throw e;
    }
  }

  // Get User details from Username
  async getUserByUsername(inputData) {
    try {
      const { username } = inputData;

      // Get user from DB
      const selectSqlString = `SELECT ${this.sqlSelectFields}, password, status
        FROM \`${this.tableName}\` WHERE username = ?`,
        selectSqlData = [username];
      
      return await MySQLDB.preparedQuery(selectSqlString, selectSqlData);
    }
    catch(e) {
      logger.error(`mysql:user getUserByUsername() function => Error = `, e);
      throw e;
    }
  }

  // Insert User
  async insert(inputData) {
    try {
      let { username, displayName, emailId, mobileNo, password } = inputData;
      let selectSqlString, selectSqlData;

      // Check if Username already present in Table
      const usernameCheckResult = await this.getUserByUsername({ username });
      // Send error message
      if(usernameCheckResult && usernameCheckResult.length > 0 && usernameCheckResult[0].userId > 0) {
        return { error: true, message: 'Username already exists' };
      }

      // Check if Email Id already present in Table
      selectSqlString = `SELECT user_id AS userId FROM \`${this.tableName}\` WHERE email_id = ?`;
      selectSqlData = [emailId];
      const emailIdCheckResult = await MySQLDB.preparedQuery(selectSqlString, selectSqlData);
      // Send error message
      if(emailIdCheckResult && emailIdCheckResult.length > 0 && emailIdCheckResult[0].userId > 0) {
        return { error: true, message: 'Email id already exists' };
      }

      // Convert password to md5 hash
      password = generateHash(password);

      // Build Insert Query & Data
      const insertSqlString = `INSERT INTO \`${this.tableName}\` 
        (username, display_name, email_id, mobile_no, password, status, created_by) 
        VALUES(?,?,?,?,?,?,?)`;
      const insertSqlData = [
        username, displayName, emailId, mobileNo,
        password, 'A', 0
      ];

      // Insert into table
      const insertResult = await MySQLDB.preparedQuery(insertSqlString, insertSqlData);
      if(!insertResult) {
        return { error: true, message: 'Unable to create User' };
      }

      // Inserted Id
      const insertId = insertResult.insertId;

      // Send back Success response
      return {
        error: false,
        message: 'User created',
        data: { insertId }
      };
    }
    catch(e) {
      logger.error(`mysql:user insert() function => Error = `, e);
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

      // Build Update Query & Data
      const updateSqlString = `UPDATE \`${this.tableName}\` SET display_name = ?, mobile_no = ?,
        modified_by = ?, modified_date = ?
        WHERE user_id = ?`;
      const updateSqlData = [displayName, mobileNo, loggedInUserId, MySQLDB.getCurrentTimestamp(), userId];

      // Update record
      const updateResult = await MySQLDB.preparedQuery(updateSqlString, updateSqlData);
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
      logger.error(`mysql:user update() function => Error = `, e);
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

      // Build Update Query & Data
      const updateSqlString = `UPDATE \`${this.tableName}\` SET status = ?, modified_by = ?, modified_date = ?
        WHERE user_id = ?`;
      const updateSqlData = ['I', loggedInUserId, MySQLDB.getCurrentTimestamp(), userId];

      // Update record
      const updateResult = await MySQLDB.preparedQuery(updateSqlString, updateSqlData);
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
      logger.error(`mysql:user delete() function => Error = `, e);
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
      let userResult = await this.getUserByUsername({ username });
      // Username not found
      if(!userResult || userResult.length === 0 || !userResult[0].userId) {
        return { error: true, message: this.dataNotFoundMsg };
      }
      // Get only first result
      userResult = userResult[0];

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
        const updateSqlString = `UPDATE \`${this.tableName}\` SET last_login_time = ? WHERE user_id = ?`,
          updateSqlData = [MySQLDB.getCurrentTimestamp(), userId];
        await MySQLDB.preparedQuery(updateSqlString, updateSqlData);
      }
      catch(e) {
        logger.error(`mysql:user login() function, Update last login time => Error = `, e);
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
      logger.error(`mysql:user login() function => Error = `, e);
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
      logger.error(`mysql:user logout() function => Error = `, e);
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
      logger.error(`mysql:user generateRefreshToken() function => Error = `, e);
      throw e;
    }
  }
}

module.exports = User;