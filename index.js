'use strict';

// Read config first
const config = require('config');
// Check if config is read properly or not
if(!config.has('host') || !config.has('port') || !config.has('mysql')) {
  console.error('Config not found. Please create config/default.json file');
  process.exit(1);
}

// Set node environment
if(!process.env.NODE_ENV) process.env.NODE_ENV = config.get('env') || 'development';

// Required modules
const express = require('express'),
  compression = require('compression'),
  helmet = require('helmet'),
  cors = require('cors'),
  responseTime = require('response-time'),
  reqlib = require('app-root-path').require,
  requestIp = require('request-ip'),
  logger = reqlib('/helpers/logger'),
  SequelizeConn = reqlib('/db/sequelize/sequelize'),
  RedisDB = reqlib('/db/redis/redis'),
  MongoDB = reqlib('/db/mongo/mongo'),
  getMessage = reqlib('/constants/messages');
const { rateLimiter } = reqlib('/middlewares/rateLimiter');

// Load express app
const app = express();

// Enable cors
// For exposing auth header
app.use(cors({ exposedHeaders: ['X-Auth-Token', 'X-Refresh-Token'] }));

// Parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))
// Parse application/json
app.use(express.json({ limit: '1mb' }));

// Add api response time header to api
app.use(responseTime());

// Secure express headers
app.use(helmet());

// Compress all responses
app.use(compression());

// Set client ip address
app.use(requestIp.mw({ attributeName : '_clientIpAddress' }))

// Serve upload folder files
app.use('/uploads', express.static('uploads'));

// Add local response to every request
app.use('*', (req, res, next) => {
  res.locals._TMP = {
    skipToLastMiddleware: false, // directly skip to send response middleware
    response: {error: false, errorCode: 0, message: '', data: {}},
    statusCode: 200
  };
  next();
});

// For api rate limiting
app.use(rateLimiter);

// Handle error related to external middlwares
// like JSON parsing issue in bodyparser
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).send({ error: true, message: getMessage['BAD_REQUEST'] });
  }

  next();
});

// Load all routes
app.use('/api/v1', reqlib('/routes/v1/index'));

// For 404 error handling
app.use((req, res, next) => {
  //url requested
  res.status(404);

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: true, message: getMessage['NOT_FOUND'] });
    return;
  }

  // default to plain-text
  res.type('txt').send(getMessage['NOT_FOUND']);
});

// Exit process with logging msg
const exitProcess = (errorMsg, errorObj = null) => {
  console.error(`Date : ${Date.now()}, ${errorMsg} : ${errorObj}`);
  logger.error(`Error msg = ${errorMsg}`, errorObj);
  process.exit(1);
};

// Start server
const PORT = config.get('port');
app.listen(PORT, async () => {
  logger.info(`App listening on port ${PORT} !`);

  try {
    // Connect mysql db
    const sequelizeConnObj = new SequelizeConn();
    const connectionStatus = await sequelizeConnObj.connectDB();
    if(!connectionStatus) {
      exitProcess('Unable to connect to MySQL DB');
    }
  }
  catch(e) {
    exitProcess('Unable to connect to MySQL DB', e);
  }

  try {
    // Connect redis db
    const redisDB = new RedisDB();
    const connectionStatus = await redisDB.connectDB();
    if(!connectionStatus) {
      exitProcess('Unable to connect to Redis DB');
    }
  }
  catch(e) {
    exitProcess('Unable to connect to Redis DB', e);
  }

  /*
  try {
    // Connect mongo db
    const mongoDbObj = new MongoDB();
    const connectionStatus = await mongoDbObj.connectDB();    
    if(!connectionStatus) {
      exitProcess('Unable to connect to Mongo DB');
    }
  }
  catch(e) {
    exitProcess('Unable to connect to Mongo DB', e);
  }
  */
});

// Handle unhandled rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error('Date ==> ', Date.now(), ', Unhandled Rejection Promise ==> ', promise);
  logger.error('Unhandled Rejection reason : ', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  exitProcess('Uncaught Exception', err);
});