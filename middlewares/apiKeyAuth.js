'use strict';

// Required modules
const appRoot = require('app-root-path'),
  reqlib = appRoot.require,
  logger = reqlib('/helpers/logger');
// For setting error response
const { setErrorResponse } = reqlib('/helpers/response.js');

// Validate api key
const auth = async (req, res, next) => {
  try {
    // skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // get api key from header
    const apiKey = req.header('X-API-Key');
    // check if api key is present
    if(!apiKey) {
      return setErrorResponse(res, next, 'API Key not present in request', 401);
    }

    //
    // Check API Key in Database
    /*
    const checkApiKeyResult = await checkApiKey({apiKey});
    // Not found
    if(checkApiKeyResult.error) {
      return setErrorResponse(res, next, 'Auth failed. API Key invalid', 401);
    }
    */

    // auth success
    return next();
  }
  catch(e) {
    logger.error(`middleware:apiKeyAuth => Error = `, e);
    return setErrorResponse(res, next, 'Auth failed', 401);
  }
};

module.exports = auth;