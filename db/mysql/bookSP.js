'use strict';

// Required modules
const reqlib = require('app-root-path').require,
  logger = reqlib('/helpers/logger'),
  MySQLDB = new (reqlib('/db/mysql/mysql'))(),
  getMessage = reqlib('/constants/messages'),
  getErrorCode = reqlib('/constants/errorCodes');
const { generateRandomStringForSP } = reqlib('/helpers/common');

// SP Error Codes
// [ 0 = Success, 1 = Error ]

// Book Table related functions
class Book {
  constructor() {
    this.somethingWrongMsg = getMessage['SOMETHING_WRONG'];
    this.spExecuteErrMsg = getMessage['SP_EXECUTE_ERR'];
    this.successMsg = getMessage['SUCCESS'];
    this.dataNotFoundMsg = 'Book not found';
    this.dataNotFoundErrorCode = getErrorCode['DATA_NOT_FOUND'];
  }

  // Insert Book
  async insert(inputData) {
    return this.manipulateData('INSERT', inputData);
  }

  // Update Book
  async update(inputData) {
    return this.manipulateData('UPDATE', inputData);
  }

  // Delete Book
  async delete(inputData) {
    inputData.status = 'I';
    return this.manipulateData('DELETE', inputData);
  }

  // Get Book Details by Id
  async getById(inputData) {
    return this.fetchData('GETBYID', inputData);
  }

  // Use to Manipulate data
  // Insert, Update, Delete
  async manipulateData(mode = 'INSERT', inputData = {}) {
    try {
      // Call sp
      const { spReturnValues } = await this.callSP(mode, inputData);
      // Check return values
      if(!spReturnValues) return { error: true, message: this.somethingWrongMsg };
      // Return status with error
      if(spReturnValues.returnStatus !== 0) return { error: true, message: spReturnValues.returnMessage };
      
      // Response
      let dataToSend = {};
      if(mode === 'INSERT') {
        dataToSend.insertId = spReturnValues.bookId;
      }

      // Success
      return {
        error: false,
        message: spReturnValues.returnMessage,
        data: dataToSend
      };
    }
    catch(e) {
      logger.error(`mysql:book manipulateData() function => Error = `, e);
      throw e;
    }
  }

  // Get data from table
  // Select
  async fetchData(mode = 'GETBYID', inputData = {}) {
    try {
      // Call sp
      const { spReturnValues, spResultDataSet } = await this.callSP(mode, inputData);
      // Check return values
      if(!spReturnValues) return { error: true, message: this.somethingWrongMsg };
      // Return status with error
      if(spReturnValues.returnStatus !== 0) return { error: true, message: spReturnValues.returnMessage };
      
      // Check if data found
      if(!Array.isArray(spResultDataSet) || spResultDataSet.length === 0) {
        return { error: true, errorCode: this.dataNotFoundErrorCode, message: this.dataNotFoundMsg };
      }
      
      // Success
      return {
        error: false,
        message: this.successMsg,
        data: { book: spResultDataSet }
      };
    }
    catch(e) {
      logger.error(`mysql:book fetchData() function => Error = `, e);
      throw e;
    }
  }

  // Call SP
  async callSP(mode = 'GETBYID', inputData = {}) {
    try {
      // Set required data
      const dateTimeMysql = 'CURRENT_TIMESTAMP()', // Date Time
        dateMysql = 'CURRENT_DATE()', // Date
        randomStr = generateRandomStringForSP(), // Random number string
        emptyStr = "''"; // Empty string

      // Escape input data
      for(let i in inputData) {
        if(!inputData[i]) inputData[i] = MySQLDB.escape(inputData[i]);
      }

      // Define set variables
      const returnStatusSqlSet = `@returnStatus${randomStr}`,
        returnMessageSqlSet = `@returnMessage${randomStr}`,
        tableIdSqlSet = `@bookId${randomStr}`;

      // Set table id
      const setInOutValues = `SET ${tableIdSqlSet} = ${inputData.bookId || 0};`;

      // Call SP with Input & Output parameters
      const spCall = `CALL SP_BOOK(
        ${tableIdSqlSet},
        ${inputData.isbnNumber || emptyStr},
        ${inputData.bookName || emptyStr},
        ${inputData.bookSummary || emptyStr},
        ${inputData.bookAuthor || emptyStr},
        ${inputData.publication || emptyStr},
        ${inputData.publishDate || dateMysql},
        ${inputData.status || "'A'"},
        ${inputData.loggedInUserId || 0},
        ${inputData.createdOn || dateTimeMysql},
        ${returnStatusSqlSet},
        ${returnMessageSqlSet},
        ${mode}
      );`;
      
      // Get return values from called SP
      const returnValues = `SELECT ${returnStatusSqlSet} as returnStatus, 
        ${returnMessageSqlSet} as returnMessage, ${tableIdSqlSet} as bookId;`;

      // Run multiple query statements
      const multiquery = setInOutValues + spCall + returnValues,
        multiqueryResult = await MySQLDB.query(multiquery);
      // Check if multi query result is ok or not
      if(!multiqueryResult || !Array.isArray(multiqueryResult) || multiqueryResult.length < 3) {
        throw new Error(this.spExecuteErrMsg);
      }

      // Get required result data from multiquery result
      multiqueryResult.shift(); // remove first element as its set query result
      const returnValuesResult = multiqueryResult.pop(),
        spCallResult = multiqueryResult;

      // Set null value to already set values
      const setNullValues = `SET ${tableIdSqlSet} = null, ${returnStatusSqlSet} = null, 
        ${returnMessageSqlSet} = null;`;
      await MySQLDB.query(setNullValues);

      // Final result
      const spReturnValues = (returnValuesResult && returnValuesResult.length > 0) 
        ? returnValuesResult[0] : [];
      const spResultDataSet = (spCallResult && Array.isArray(spCallResult) && spCallResult.length > 0) 
        ? spCallResult[0] : [];

      // Return final result
      return { spReturnValues, spResultDataSet };
    }
    catch(e) {
      logger.error(`mysql:book callSP() function => Error = `, e);
      throw e;
    }
  }
}

module.exports = Book;