'use strict';

// This module will have auth functions related to JWT auth mechanisms
// Generate JWT Auth token & Refresh Token

// Required modules
const jwt = require('jsonwebtoken'),
  fs = require('fs'),
  { v4: uuidv4 } = require('uuid'),
  config = require('config'),
  appRoot = require('app-root-path'),
  moment = require('moment');
// Read private key
const privateKey = fs.readFileSync(appRoot + '/keys/auth/private.pem', 'utf8');

// Generate new Auth token
const generateAuthToken = (data) => {
  return new Promise((resolve, reject) => {
    // No data
    if(!data || Object.keys(data).length === 0) {
      return reject('Data required to generate Auth token not passed');
    }

    // Get data from object
    const { userId, source } = data;

    // For token expiry
    let tokenExpiryInMin;
    // For Web
    if(source === 1) {
      tokenExpiryInMin = config.get('auth.tokenExpiryInMin.web') || 10;
    }
    // For Android
    else if(source === 2) {
      tokenExpiryInMin = config.get('auth.tokenExpiryInMin.android') || 8*60;
    }
    // Default
    else {
      tokenExpiryInMin = 10;
    }
    // Set final values
    const tokenExpiry = tokenExpiryInMin + 'm',
      tokenExpiryDateTime = moment().add(tokenExpiryInMin, 'minutes').format('YYYY-MM-DD HH:mm:ss');

    // Generate new token now
    const jwtId = uuidv4(),
      refreshToken = uuidv4();
    const jwtOptions = {
      algorithm: config.get('auth.algorithm') || 'RS256',
      expiresIn: tokenExpiry,
      issuer: config.get('auth.issuer'),
      audience: config.get('auth.audience'),
      jwtid: jwtId
    };
    jwt.sign(data, privateKey, jwtOptions, (err, token) => {
      // On error
      if(err || !token) {
        return reject('Unable to create Auth token');
      }

      // On success
      resolve({
        authToken: token,
        refreshToken,
        jwtId,
        tokenExpiry: tokenExpiryDateTime
      });
    });
  });
};

module.exports = {
  generateAuthToken
};