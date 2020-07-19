'use strict';

// This file will contain all common custom error message functions
const joi = require('@hapi/joi')
  .extend(require('@hapi/joi-date'));

const allowEmptyNull = ['', null],
  allowEmptyNullZero = allowEmptyNull.concat([0]);

// For Alphabet Input
const getAlphabetError = (label, min, max, required = true) => {
  let alphabetError = '';
  const regex = /^[a-zA-Z]*$/;

  if (required) {
    alphabetError = joi.string().trim()
      .regex(regex).min(min).max(max).required()
      .error(errors => generateErrorText(errors, label));
  }
  else {
    alphabetError = joi.string().trim().allow(...allowEmptyNull)
      .regex(regex).min(min).max(max).optional()
      .error(errors => generateErrorText(errors, label));
  }

  return alphabetError;
}

// For Alphabet & Number Input
const getAlphaNumError = (label, min, max, required = true) => {
  let alphabetError = '';

  if (required) {
    alphabetError = joi.string().trim().alphanum()
      .min(min).max(max).required()
      .error(errors => generateErrorText(errors, label));
  }
  else {
    alphabetError = joi.string().trim().alphanum().allow(...allowEmptyNull)
      .min(min).max(max).optional()
      .error(errors => generateErrorText(errors, label));
  }

  return alphabetError;
}

// For Text Input
const getTextCheckError = (label, min, max, required = true) => {
  let textError = '';

  if (required) {
    textError = joi.string().trim().min(min).max(max).required()
      .error(errors => generateErrorText(errors, label));
  }
  else {
    textError = joi.string().trim().min(min).max(max).allow(...allowEmptyNull).optional()
      .error(errors => generateErrorText(errors, label));
  }

  return textError;
}

// For All Table Id & Integer Input 
const getIdError = (label, required = true) => {
  let idError = '';

  if (required) {
    idError = joi.number().integer().greater(0).required()
      .error(errors => generateErrorText(errors, label));
  }
  else {
    idError = joi.number().integer().greater(0).allow(...allowEmptyNullZero).optional()
      .error(errors => generateErrorText(errors, label));
  }

  return idError;
}

// For Password
const getPasswordError = (label = 'Password') => {
  return joi.string().trim().min(8).max(20)
    .regex(/^(?=.*\d)(?=.*[@#\-_$%^&*+=!,\?])(?=.*[a-z])(?=.*[A-Z])[0-9A-Za-z@#\-_$%^&*+=!,\?]{8,20}$/)
    .required()
    .error(errors => {
      errors.forEach(err => {
        switch (err.code) {
          case 'any.required':
            err.message = `${label} required`;
            break;
          case 'string.empty':
            err.message = `${label} cannot be empty`;
            break;
          case 'string.min':
            err.message = `${label} should have at least ${err.local.limit} characters`;
            break;
          case 'string.max':
            err.message = `${label} should have at most ${err.local.limit} characters`;
            break;
          case 'string.pattern.base':
            err.message = `${label} invalid. ${label} should be at least 8 characters in length and `;
            err.message += 'should include at least one upper case letter, one lower case letter, ';
            err.message += 'one number, and one special character(@#-_$%^&*+=!,?).';
            break;
          default:
            break;
        }
      });
      return errors;
    });
}

// For mobile number
const getMobileNoError = (label, required = true) => {
  let mobileNoError;
  const regex = /^[6-9]{1}[0-9]{9}$/;

  if (required) {
    mobileNoError = joi.string().trim().regex(regex).required()
      .error(errors => generateErrorText(errors, label));
  }
  else {
    mobileNoError = joi.string().trim().regex(regex).allow(...allowEmptyNull).optional()
      .error(errors => generateErrorText(errors, label));
  }

  return mobileNoError;
}

// For email id
const getEmailIdError = (label, required = true) => {
  let emailIdError;

  if (required) {
    emailIdError = joi.string().trim().email().required()
      .error(errors => generateErrorText(errors, label));
  }
  else {
    emailIdError = joi.string().trim().email().allow(...allowEmptyNull).optional()
      .error(errors => generateErrorText(errors, label));
  }

  return emailIdError;
}

// Validate date
const validateDateError = (label, dateFormat = 'YYYY-MM-DD', required = true) => {
  let dateError = '';

  if (required) {
    dateError = joi.date().format(dateFormat).required()
      .error(errors => generateErrorText(errors, label));
  }
  else {
    dateError = joi.date().format(dateFormat).allow(...allowEmptyNull).optional()
      .error(errors => generateErrorText(errors, label));
  }

  return dateError;
}

// Validation for comparing dates
const compareDateError = (label, validateAgainst, dateFormat = 'YYYY-MM-DD', required = true) => {
  let compareDateError = '';

  if (required) {
    compareDateError = joi.date().format(dateFormat)
      .min(joi.ref(validateAgainst)).required()
      .error(errors => generateErrorText(errors, label));
  }
  else {
    compareDateError = joi.date().format(dateFormat)
      .min(joi.ref(validateAgainst)).allow(...allowEmptyNull).optional()
      .error(errors => generateErrorText(errors, label));
  }

  return compareDateError;
}

// Generate common error text for JOI schema
const generateErrorText = (errors, label) => {
  errors.forEach(err => {
    switch (err.code) {
      // For any
      case 'any.required':
        err.message = `${label} required`;
        break;
      case 'any.unknown':
        err.message = `Unknown field`;
        break;
      case 'any.invalid':
        err.message = `${label} is invalid`;
        break;
      // For string
      case 'string.empty':
        err.message = `${label} cannot be empty`;
        break;
      case 'string.alphanum':
        err.message = `${label} should contain alphabet & numbers only`;
        break;
      case 'string.min':
        err.message = `${label} should have at least ${err.local.limit} characters`;
        break;
      case 'string.max':
        err.message = `${label} should have at most ${err.local.limit} characters`;
        break;
      case 'string.allow':
        err.message = `${label} is invalid`;
        break;
      case 'string.pattern.base':
        err.message = `${label} is invalid`;
        break;
      case 'string.base':
        err.message = `${label} is invalid`;
        break;
      case 'string.email':
        err.message = `${label} is invalid`;
        break;
      case 'string.length':
        err.message = `${label} should have ${err.local.limit} characters`;
        break;
      case 'string.ip':
        err.message = `${label} is invalid`;
        break;
      case 'string.hostname':
        err.message = `${label} must be a valid ip address or hostname`;
        break;
      // For number
      case 'number.base':
        err.message = `${label} is invalid`;
        break;      
      case 'number.integer':
        err.message = `${label} is invalid`;
        break;
      case 'number.greater':
        err.message = `${label} must be greater than ${err.local.limit}`;
        break;
      case 'number.min':
        err.message = `${label} must be larger than or equal to ${err.local.limit}`;
        break;
      case 'number.max':
        err.message = `${label} must be lesser than or equal to ${err.local.limit}`;
        break; 
      // For date     
      case 'date.strict':
        err.message = `${label} must be a valid date`;
        break;
      case 'date.format':
        err.message = `${label} is invalid. Valid date format is ${err.local.format}`;
        break;
      case 'date.base':
        err.message = `${label} should be a valid date`;
        break;
      case 'date.min':
        err.message = `${label} should be a greater than ${err.local.limit}`;
        break;
      // For array
      case 'array.base':
        err.message = `${label} must be an array`;
        break;
      case 'array.min':
        err.message = `${label} must contain at least 1 items`;
        break;
      case 'array.includesOne':
        err.message = `${label} is invalid`;
        break;
      case 'array.includesSingle':
        err.message = `${label} is invalid`;
        break;
      case 'array.unique':
        err.message = `${label} should be unique`;
        break;
      // For boolean
      case 'boolean.base':
        err.message = `${label} is invalid`;
        break;
      // For alternatives
      case 'alternatives.base':
        err.message = `${label} is invalid`;
        break;        
      default:
        break;
    }
  });

  return errors;
}

module.exports = {
  generateErrorText,
  getAlphabetError,
  getAlphaNumError,
  getTextCheckError,
  getIdError,
  getPasswordError,
  getEmailIdError,
  getMobileNoError,
  validateDateError,
  compareDateError,
};