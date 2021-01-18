'use strict';

// Required modules
const express = require('express'),
  router = express.Router(),
  reqlib = require('app-root-path').require,
  sendResponse = reqlib('/middlewares/response'),
  logger = reqlib('/helpers/logger'),
  Book = reqlib('/db/sequelize/book');
const { setErrorResponse } = reqlib('/helpers/response.js');
// Middlewares
const {
  validateCreateBookApi,
  validateUpdateBookApi,
  validateDeleteBookApi,
  validateGetBookApi,
  validateBookListingApi
} = reqlib('/middlewares/validations/book');

// Create Book
router.post('/create', validateCreateBookApi, async (req, res, next) => {
  try {
    // Skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // Request body
    const inputData = req.body;
    inputData.loggedInUserId = res.locals._TMP.user.userId;

    // Insert to db
    const bookObj = new Book(),
      insertResult = await bookObj.insert(inputData);
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

// Update Book
router.post('/update', validateUpdateBookApi, async (req, res, next) => {
  try {
    // Skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // Request body
    const inputData = req.body;
    inputData.loggedInUserId = res.locals._TMP.user.userId;

    // Update
    const bookObj = new Book(),
      updateResult = await bookObj.update(inputData);
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

// Delete Book
router.post('/delete', validateDeleteBookApi, async (req, res, next) => {
  try {
    // Skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // Request body
    const inputData = req.body;
    inputData.loggedInUserId = res.locals._TMP.user.userId;

    // Delete
    const bookObj = new Book(),
      deleteResult = await bookObj.delete(inputData);
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

// Get Book details by book id
router.get('/get/:bookId', validateGetBookApi, async (req, res, next) => {
  try {
    // skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // Get book details from DB
    const bookId = req.params.bookId,
      bookObj = new Book(),
      bookResult = await bookObj.getByBookId({ bookId });
    // Check for error
    if(bookResult.error) {
      return setErrorResponse(res, next, bookResult.message, 400, bookResult.errorCode || 0);
    }

    // Success
    res.locals._TMP.response.message = bookResult.message;
    res.locals._TMP.response.data = bookResult.data || {};
    return next();
  }
  catch(e) {
    logger.error(`Error in ${req.originalUrl} api, Error = `, e);
    return setErrorResponse(res, next);
  }
}, sendResponse);

// Get All Books
router.get('/getall', async (req, res, next) => {
  try {
    // skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // Get all Books
    const bookObj = new Book(),
      bookResult = await bookObj.getAll();
    // Check for error
    if(bookResult.error) {
      return setErrorResponse(res, next, bookResult.message, 400, bookResult.errorCode || 0);
    }

    // Success
    res.locals._TMP.response.message = bookResult.message;
    res.locals._TMP.response.data = bookResult.data || {};
    return next();
  }
  catch(e) {
    logger.error(`Error in ${req.originalUrl} api, Error = `, e);
    return setErrorResponse(res, next);
  }
}, sendResponse);

// Get Book List with the help of Filters & Pagination
router.get('/listing', validateBookListingApi, async (req, res, next) => {
  try {
    // skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // Request query
    const inputData = req.query;

    // Get Book list
    const bookObj = new Book(),
      bookResult = await bookObj.getListing(inputData);
    // Check for error
    if(bookResult.error) {
      return setErrorResponse(res, next, bookResult.message, 400, bookResult.errorCode || 0);
    }

    // Success
    res.locals._TMP.response.message = bookResult.message;
    res.locals._TMP.response.data = bookResult.data || {};
    return next();
  }
  catch(e) {
    logger.error(`Error in ${req.originalUrl} api, Error = `, e);
    return setErrorResponse(res, next);
  }
}, sendResponse);

module.exports = router;