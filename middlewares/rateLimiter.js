'use strict';

// Required modules
const appRoot = require('app-root-path'),
  reqlib = appRoot.require,
  config = require('config'),
  redis = require('redis'),
  logger = reqlib('/helpers/logger');
// For rate limiter
const { RateLimiterRedis } = require('rate-limiter-flexible');
// For setting error response
const { setErrorResponse } = reqlib('/helpers/response.js');
// Define some required constants for login limiter
const maxWrongLoginAttemptsByIPperDay = 100,
  maxConsecutiveLoginFailsByUsernameAndIP = 10;

// Redis client
const redisClient = redis.createClient({
  host: config.get('redis.host'),
  port: config.get('redis.port'),
  enable_offline_queue: false
});

// Rate limiter config for all API
const allApiRateLimiter = new RateLimiterRedis({
  redis: redisClient,
  keyPrefix: 'api_rate_limiter_middleware',
  points: 500, // 500 requests
  duration: 10, // per 10 second by IP
  blockDuration: 60 * 5 // Block for next 5 min
});

// Login limiter config for IP
const loginLimiterSlowBruteByIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail_ip_per_day',
  points: maxWrongLoginAttemptsByIPperDay,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24 // Block for 1 day, if 100 wrong attempts per day
});

// Login limiter config for Username & IP
const loginLimiterConsecutiveFailsByUsernameAndIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail_consecutive_username_and_ip',
  points: maxConsecutiveLoginFailsByUsernameAndIP,
  duration: 60 * 60 * 24 * 90, // Store number for 90 days since first fail
  blockDuration: 60 * 60 // Block for 1 hour
});

// Get minutes & seconds with padded zero
const getHourMinSecPadded = (totalSeconds) => {
  let hours = Math.floor(totalSeconds / (60 * 60));

  const divisorForMinutes = totalSeconds % (60 * 60);
  let minutes = Math.floor(divisorForMinutes / 60);

  const divisorForSeconds = divisorForMinutes % 60;
  let seconds = Math.ceil(divisorForSeconds);
  
  hours = String(hours).padStart(2, '0');
  minutes = String(minutes).padStart(2, '0');
  seconds = String(seconds).padStart(2, '0');

  return [hours, minutes, seconds];
};

// Rate limiter middleware for all API
const rateLimiter = async (req, res, next) => {
  const ipAddr = req._clientIpAddress;
  allApiRateLimiter.consume(ipAddr)
    .then((rateLimiterRes) => {
      next();
    })
    .catch((rejRes) => {
      logger.error(`middleware:rateLimiter => IP = ${ipAddr}, Error = `, rejRes);

      if(rejRes instanceof Error) {
        // Some Redis or module error
        // setting as internal server error
        return setErrorResponse(res, next);
      }
      else {
        // Can't consume
        // If there is no error, rateLimiterRedis promise rejected with number of ms before next request allowed
        const retrySecs = Math.round(rejRes.msBeforeNext / 1000) || 1;
        res.set('Retry-After', String(retrySecs));

        // build error message
        const [hours, minutes, seconds] = getHourMinSecPadded(retrySecs);
        const errorMsg = `Too many requests. Please try again after ${minutes}:${seconds} minutes`;

        return setErrorResponse(res, next, errorMsg, 429);
      }
    });
};

// Login rate limiter middleware for all API
const loginRateLimiter = async (req, res, next) => {
  try {
    // skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();

    // get username & ip
    const ipAddr = req._clientIpAddress,
      usernameIPkey = `${req.body.username.toLowerCase()}_${ipAddr}`;

    // Get response from redis
    const [resUsernameAndIP, resSlowByIP] = await Promise.all([
      loginLimiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey),
      loginLimiterSlowBruteByIP.get(ipAddr),
    ]);
    
    // Check if IP or Username + IP is already blocked
    let retrySecs = 0;
    if(resSlowByIP !== null && resSlowByIP.consumedPoints > maxWrongLoginAttemptsByIPperDay) {
      retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1;
    }
    else if(resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > maxConsecutiveLoginFailsByUsernameAndIP) {
      retrySecs = Math.round(resUsernameAndIP.msBeforeNext / 1000) || 1;
    }

    // Already blocked
    if(retrySecs > 0) {
      res.set('Retry-After', String(retrySecs));

      // build error message
      const [hours, minutes, seconds] = getHourMinSecPadded(retrySecs),
        errorMsg = `Login blocked. Please try again after ${hours}:${minutes}:${seconds} hours`;

      return setErrorResponse(res, next, errorMsg, 429);
    }

    // All good then set required details for login api & proceed to next middleware
    res.locals._TMP.loginRateLimiter = {
      usernameIPkey,
      loginLimiterSlowBruteByIP,
      loginLimiterConsecutiveFailsByUsernameAndIP,
      resUsernameAndIP
    };

    // Proceed to login api
    next();
  }
  catch(e) {
    logger.error(`middleware:loginRateLimiter => IP = ${req._clientIpAddress}, Error = `, e);
    return setErrorResponse(res, next);
  }
};

module.exports = {
  rateLimiter,
  loginRateLimiter
};