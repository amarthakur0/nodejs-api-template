'use strict';

// This file will contain user joi related validation schema 
const joi = require('@hapi/joi');
const {
  getIdError,
  getTextCheckError,
  getAlphaNumError,
  getEmailIdError,
  getMobileNoError,
  getPasswordError,
  generateErrorText
} = require('./common.js');

// For Username
const usernameError = getAlphaNumError('Username', 3, 20);

// For display name
const displayNameError = getTextCheckError('Display name', 3, 20);

// For mobile number
const mobileNoError = getMobileNoError('Mobile number', false);

// For email id
const emailIdError = getEmailIdError('Email id');

// For Password
const passwordError = getPasswordError();

// For api source
// 1 = Web, 2 = Android
const sourceError = joi.number().valid(1, 2).required()
  .error(errors => generateErrorText(errors, 'Source'));

// For User Id
const userIdError = getIdError('User Id');

// For Refresh Token
const refreshTokenError = getTextCheckError('Refresh Token', 1, 50);

// For User Create API
const createUserApiSchema = joi.object().keys({
  username: usernameError,
  displayName: displayNameError,
  emailId: emailIdError,
  mobileNo: mobileNoError,
  password: passwordError
});

// For User Update API
const updateUserApiSchema = joi.object().keys({
  userId: userIdError,
  displayName: displayNameError,
  mobileNo: mobileNoError
});

// For User Login API
const loginUserApiSchema = joi.object().keys({
  username: usernameError,
  password: passwordError,
  source: sourceError
});

// For Refresh Auth Token API
const refreshTokenApiSchema = joi.object().keys({
  userId: userIdError,
  refreshToken: refreshTokenError
});

// For checking only user id
const onlyUserIdSchema = joi.object().keys({
  userId: userIdError
});

module.exports = {
  createUserApiSchema,
  updateUserApiSchema,
  loginUserApiSchema,
  refreshTokenApiSchema,
  onlyUserIdSchema
};