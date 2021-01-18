'use strict';

// This file will do all api input validations
const reqlib = require('app-root-path').require;
// JOI schema
const {
  createBookApiSchema,
  updateBookApiSchema,
  onlyBookIdSchema,
  bookListingApiSchema
} = reqlib('/middlewares/validations/joi/book');
const { validateApi } = reqlib('/middlewares/validations/common');

// Validate input data for Create Book api
const validateCreateBookApi = (req, res, next) => {
  // validate with joi
  return validateApi(req, res, next, req.body, createBookApiSchema, 'validateCreateBookApi');
};

// Validate input data for Book Update api
const validateUpdateBookApi = (req, res, next) => {
  return validateApi(req, res, next, req.body, updateBookApiSchema, 'validateUpdateBookApi');
};

// Validate input data for Book Delete api
const validateDeleteBookApi = (req, res, next) => {
  return validateApi(req, res, next, req.body, onlyBookIdSchema, 'validateDeleteBookApi');
};

// Validate input data for Book Get api
const validateGetBookApi = (req, res, next) => {
  return validateApi(req, res, next, req.params, onlyBookIdSchema, 'validateGetBookApi');
};

// Validate input data for Book Listing api
const validateBookListingApi = (req, res, next) => {
  return validateApi(req, res, next, req.query, bookListingApiSchema, 'validateBookListingApi');
};

module.exports = {
  validateCreateBookApi,
  validateUpdateBookApi,
  validateDeleteBookApi,
  validateGetBookApi,
  validateBookListingApi
};