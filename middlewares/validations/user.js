'use strict';

// This file will do all api input validations
const reqlib = require('app-root-path').require;
// JOI schema
const {
  createUserApiSchema,
  updateUserApiSchema,
  loginUserApiSchema,
  refreshTokenApiSchema,
  onlyUserIdSchema
} = reqlib('/middlewares/validations/joi/user');
const { validateApi } = reqlib('/middlewares/validations/common');

// Validate input data for Create User api
const validateCreateUserApi = (req, res, next) => {
  // validate with joi
  return validateApi(req, res, next, req.body, createUserApiSchema, 'validateCreateUserApi');
};

// Validate input data for User Update api
const validateUpdateUserApi = (req, res, next) => {
  return validateApi(req, res, next, req.body, updateUserApiSchema, 'validateUpdateUserApi');
};

// Validate input data for User Delete api
const validateDeleteUserApi = (req, res, next) => {
  return validateApi(req, res, next, req.body, onlyUserIdSchema, 'validateDeleteUserApi');
};

// Validate input data for User Login api
const validateLoginUserApi = (req, res, next) => {
  // Add source if not present
  const requestBody = req.body;
  if(requestBody && !requestBody.source) requestBody.source = 1;

  // validate with joi
  return validateApi(req, res, next, requestBody, loginUserApiSchema, 'validateLoginUserApi');
};

// Validate input data for Refresh Auth Token api
const validateRefreshTokenApi = (req, res, next) => {
  return validateApi(req, res, next, req.body, refreshTokenApiSchema, 'validateRefreshTokenApi');
};

// Validate input data for User Get api
const validateGetUserApi = (req, res, next) => {
  return validateApi(req, res, next, req.params, onlyUserIdSchema, 'validateGetUserApi');
};

module.exports = {
  validateCreateUserApi,
  validateUpdateUserApi,
  validateDeleteUserApi,
  validateLoginUserApi,
  validateRefreshTokenApi,
  validateGetUserApi
};