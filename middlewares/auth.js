'use strict';

// Required modules
const jwt = require('jsonwebtoken'),
  fs = require('fs'),
  config = require('config'),
  appRoot = require('app-root-path'),
  reqlib = appRoot.require,
  logger = reqlib('/helpers/logger'),
  User = reqlib('/db/sequelize/user'),
  UserAuthToken = reqlib('/db/sequelize/userAuthToken'),
  getErrorCode = reqlib('/constants/errorCodes');
// Read public key
const publicKey = fs.readFileSync(appRoot + '/keys/auth/public.pem', 'utf8');
// For setting error response
const { setErrorResponse } = reqlib('/helpers/response.js');

// Validate auth token
const auth = (req, res, next) => {
  try {
    // skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // get auth token from request
    let token = req.header('Authorization');
    // check if token present
    if(!token) {
      return setErrorResponse(res, next, 'Auth Token not present in request', 401);
    }
    // Check if "Bearer" is present
    if(token.indexOf('Bearer') !== 0) {
      return setErrorResponse(res, next, 'Auth Token not sent properly in request', 401);
    }

    // remove "Bearer"
    token = token.replace('Bearer', '').trim();

    // validate token with jwt
    const jwtOptions = {
      algorithm: config.get('auth.algorithm') || 'RS256',
      issuer: config.get('auth.issuer'),
      audience: config.get('auth.audience')
    };
    jwt.verify(token, publicKey, jwtOptions, async (err, decoded) => {
      // error while validating
      if(err || !decoded) {
        // Check if token is expired
        if(err && err.name === 'TokenExpiredError') {
          return setErrorResponse(res, next, 'Auth Token Expired', 401, getErrorCode['AUTH_TOKEN_EXPIRED']);  
        }

        // log only invalid token
        logger.error(`middleware:auth => JWT Verify Error = `, err);

        // send invalid token for other errors
        return setErrorResponse(res, next, 'Invalid Auth Token', 401);
      }

      try {
        //
        // Safety Check - Check for user in DB
        const userId = decoded.userId,
          userObj = new User(),
          getUserResult = await userObj.getByUserId({ userId });
        // user details not found
        if(getUserResult.error) {
          return setErrorResponse(res, next, 'Auth failed. User not found', 401);
        }

        //
        // Check if auth token already exists in DB
        const authTokenObj = new UserAuthToken(),
          getAuthTokenResult = await authTokenObj.getByUserId({ userId }),
          authTokenData = getAuthTokenResult.data;
        if(getAuthTokenResult.error || !authTokenData || !authTokenData.userAuthToken || authTokenData.userAuthToken.length === 0) {
          return setErrorResponse(res, next, 'Auth failed. User token not found in DB', 401);
        }
        
        // Checks
        // 1. token match
        // 2. jwtId match
        // 3. password expiry in db
        // 4. status in DB
        // 5. check source
        const authTokenDB = authTokenData.userAuthToken[0];
        if( token !== authTokenDB.authToken 
          || decoded.jti !== authTokenDB.jwtId 
          || (new Date(authTokenDB.tokenExpiry) <= new Date())
          || decoded.source !== authTokenDB.source
          || authTokenDB.status !== 'A' ) {
            return setErrorResponse(res, next, 'Invalid Auth Token', 401);
        }

        // All good then set user details & proceed to next middleware
        res.locals._TMP.user = {
          ...getUserResult.data.user[0].dataValues,
          source: decoded.source
        };

        // auth success
        return next();
      }
      catch(e) {
        logger.error(`middleware:auth => Error = `, e);
        return setErrorResponse(res, next, 'Auth failed', 401);
      }
    });
  }
  catch(e) {
    logger.error(`middleware:auth => Error = `, e);
    return setErrorResponse(res, next, 'Auth failed', 401);
  }
};

module.exports = auth;