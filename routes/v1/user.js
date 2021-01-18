'use strict';

// Required modules
const express = require('express'),
  router = express.Router(),
  reqlib = require('app-root-path').require,
  sendResponse = reqlib('/middlewares/response'),
  logger = reqlib('/helpers/logger'),
  User = reqlib('/db/sequelize/user'),
  auth = reqlib('/middlewares/auth');
const { setErrorResponse } = reqlib('/helpers/response.js');
// Middlewares
const {
  validateCreateUserApi,
  validateUpdateUserApi,
  validateDeleteUserApi,
  validateLoginUserApi,
  validateRefreshTokenApi,
  validateGetUserApi
} = reqlib('/middlewares/validations/user');
const { loginRateLimiter } = reqlib('/middlewares/rateLimiter');

// Create User
router.post('/create', validateCreateUserApi, async (req, res, next) => {
  try {
    // Skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // Insert to db
    const inputData = req.body,
      userObj = new User(),
      insertResult = await userObj.insert(inputData);
    // Check for error
    if(insertResult.error) {
      return setErrorResponse(res, next, insertResult.message, 400);
    }

    // Success
    res.locals._TMP.response.message = insertResult.message;
    res.locals._TMP.response.data = insertResult.data || {};
    return next();
  }
  catch(e) {
    logger.error(`Error in ${req.originalUrl} api, Error = `, e);
    return setErrorResponse(res, next);
  }
}, sendResponse);

// Update User
router.post('/update', auth, validateUpdateUserApi, async (req, res, next) => {
  try {
    // Skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // Request body
    const inputData = req.body;
    inputData.loggedInUserId = res.locals._TMP.user.userId;

    // Update
    const userObj = new User(),
      updateResult = await userObj.update(inputData);
    // Check for error
    if(updateResult.error) {
      return setErrorResponse(res, next, updateResult.message, 400);
    }

    // Success
    res.locals._TMP.response.message = updateResult.message;
    res.locals._TMP.response.data = updateResult.data || {};
    return next();
  }
  catch(e) {
    logger.error(`Error in ${req.originalUrl} api, Error = `, e);
    return setErrorResponse(res, next);
  }
}, sendResponse);

// Delete User
router.post('/delete', auth, validateDeleteUserApi, async (req, res, next) => {
  try {
    // Skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // Request body
    const inputData = req.body;
    inputData.loggedInUserId = res.locals._TMP.user.userId;

    // Delete
    const userObj = new User(),
      deleteResult = await userObj.delete(inputData);
    // Check for error
    if(deleteResult.error) {
      return setErrorResponse(res, next, deleteResult.message, 400);
    }

    // Success
    res.locals._TMP.response.message = deleteResult.message;
    res.locals._TMP.response.data = deleteResult.data || {};
    return next();
  }
  catch(e) {
    logger.error(`Error in ${req.originalUrl} api, Error = `, e);
    return setErrorResponse(res, next);
  }
}, sendResponse);

// User Login api
router.post('/login', validateLoginUserApi, loginRateLimiter, async (req, res, next) => {  
  try {
    // skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // Get login rate limiter related details
    const ipAddr = req._clientIpAddress;
    const {
      usernameIPkey,
      loginLimiterSlowBruteByIP,
      loginLimiterConsecutiveFailsByUsernameAndIP,
      resUsernameAndIP
    } = res.locals._TMP.loginRateLimiter;

    // Login user
    const inputData = req.body,
      userObj = new User(),
      loginResult = await userObj.login(inputData);
    // Check for error
    if(loginResult.error) {
      // Consume rate limiter points
      try {
        const rlPromises = [loginLimiterSlowBruteByIP.consume(ipAddr)];
        // Only if user present
        if(loginResult.message !== 'User not found') {
          // Count failed attempts by Username + IP only for registered users
          rlPromises.push(loginLimiterConsecutiveFailsByUsernameAndIP.consume(usernameIPkey));
        }
        await Promise.all(rlPromises);
      }
      catch(e) {
        logger.error(`Error in ${req.originalUrl} api, Login rate limiter consume set, Error = `, e);
      }

      return setErrorResponse(res, next, loginResult.message, 400);
    }

    // Set auth token & refresh token in response header
    res.header('X-Auth-Token', loginResult.data.authToken);
    res.header('X-Refresh-Token', loginResult.data.refreshToken);

    // delete auth token & refresh token from request
    delete loginResult.data.authToken;
    delete loginResult.data.refreshToken;

    // Reset username & ip rate limiter on successful login
    try {
      if(resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > 0) {
        await loginLimiterConsecutiveFailsByUsernameAndIP.delete(usernameIPkey);
      }
    }
    catch(e) {
      logger.error(`Error in ${req.originalUrl} api, Login rate limiter delete key, Error = `, e);
    }

    // success
    res.locals._TMP.response.message = loginResult.message;
    res.locals._TMP.response.data = loginResult.data || {};
    return next();
  }
  catch(e) {
    logger.error(`Error in ${req.originalUrl} api, Error = `, e);
    return setErrorResponse(res, next);
  }
}, sendResponse);

// Logout user api
router.get('/logout', auth, async (req, res, next) => {  
  try {
    // skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // Logout
    const userId = res.locals._TMP.user.userId,
      userObj = new User(),
      logoutResult = await userObj.logout({ userId });
    // Check for error
    if(logoutResult.error) {
      return setErrorResponse(res, next, logoutResult.message, 400);
    }

    // Success
    res.locals._TMP.response.message = 'User logged out successfully';
    res.locals._TMP.response.data = logoutResult.data || {};
    return next();
  }
  catch(e) {
    logger.error(`Error in ${req.originalUrl} api, Error = `, e);
    return setErrorResponse(res, next);
  }
}, sendResponse);

// Refresh Auth Token api
router.post('/refreshToken', validateRefreshTokenApi, async (req, res, next) => {  
  try {
    // skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // Refresh tokn for user
    const inputData = req.body,
      userObj = new User(),
      refreshTokenResult = await userObj.generateRefreshToken(inputData);
    // Check for error
    if(refreshTokenResult.error) {
      return setErrorResponse(res, next, refreshTokenResult.message, 400);
    }

    // Set auth token & refresh token in response header
    res.header('X-Auth-Token', refreshTokenResult.data.authToken);
    res.header('X-Refresh-Token', refreshTokenResult.data.refreshToken);

    // success
    res.locals._TMP.response.message = refreshTokenResult.message;
    res.locals._TMP.response.data = {};
    return next();
  }
  catch(e) {
    logger.error(`Error in ${req.originalUrl} api, Error = `, e);
    return setErrorResponse(res, next);
  }
}, sendResponse);

// Get User details by user id
router.get('/get/:userId', auth, validateGetUserApi, async (req, res, next) => {
  try {
    // skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // Get user details from DB
    const userId = req.params.userId,
      userObj = new User(),
      userResult = await userObj.getByUserId({ userId });
    // Check for error
    if(userResult.error) {
      return setErrorResponse(res, next, userResult.message, 400, userResult.errorCode || 0);
    }

    // Success
    res.locals._TMP.response.message = userResult.message;
    res.locals._TMP.response.data = userResult.data || {};
    return next();
  }
  catch(e) {
    logger.error(`Error in ${req.originalUrl} api, Error = `, e);
    return setErrorResponse(res, next);
  }
}, sendResponse);

// Get Users
router.get('/getall', auth, async (req, res, next) => {
  try {
    // skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // Get user details from DB
    const userObj = new User(),
      userResult = await userObj.getAll();
    // Check for error
    if(userResult.error) {
      return setErrorResponse(res, next, userResult.message, 400, userResult.errorCode || 0);
    }

    // Success
    res.locals._TMP.response.message = userResult.message;
    res.locals._TMP.response.data = userResult.data || {};
    return next();
  }
  catch(e) {
    logger.error(`Error in ${req.originalUrl} api, Error = `, e);
    return setErrorResponse(res, next);
  }
}, sendResponse);

module.exports = router;