'use strict';

// Required modules
const reqlib = require('app-root-path').require,
  logger = reqlib('/helpers/logger'),
  getMessage = reqlib('/constants/messages');
const { setErrorResponse } = reqlib('/helpers/response.js');
const { isObjectEmpty } = reqlib('/helpers/common');

// Text message
const badRequestText = getMessage['BAD_REQUEST'],
  reqBodyNpText = getMessage['REQ_BODY_NP'];

// Validate input data for User Get api
const validateApi = (req, res, next, requestBody, joiSchema, middlewareName = null) => {
  try {
    // skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // for error
    let error = false, errorMsg = '';

    // check request body
    if(!error && isObjectEmpty(requestBody)) {
      error = true;
      errorMsg = reqBodyNpText;
    }
    
    // check all required parameters
    if(!error) {
      try {
        // Validate request body data with JOI schema
        const {'error': joiError} = joiSchema.validate(requestBody);
        // on error
        if(joiError) {
          error = true;
          const joiErrorMsg = (joiError.details && joiError.details.length > 0)
            ? joiError.details[0].message : joiError.message;
          errorMsg = joiErrorMsg || badRequestText;
        }
      }
      catch(e) {
        logger.error(`middleware:${middlewareName} => Error = `, e);
        error = true;
        errorMsg = badRequestText;
      }
    }

    // If error exists send to last middleware
    if(error) {
      return setErrorResponse(res, next, errorMsg, 400);
    }

    // move to next middleware
    return next();
  }
  catch(e) {
    logger.error(`middleware:validateApi => Error = `, e);
    return setErrorResponse(res, next, badRequestText, 400);
  }
};

module.exports = {
  validateApi
}