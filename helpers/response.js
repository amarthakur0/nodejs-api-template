'use strict';

// Set error response
const setErrorResponse = (res, next, errorMsg = 'Internal server error', statusCode = 500, errorCode = 0) => {
  res.locals._TMP.skipToLastMiddleware = true;
  res.locals._TMP.response.error = true;
  res.locals._TMP.response.errorCode = errorCode;
  res.locals._TMP.response.message = errorMsg;
  res.locals._TMP.statusCode = statusCode;
  next();
}

module.exports = {
  setErrorResponse
};