'use strict';

// This file will contain commonly used functions
const reqlib = require('app-root-path').require,
  logger = reqlib('/helpers/logger'),
  crypto = require('crypto'),
  CryptoJS = require("crypto-js"),
  moment = require('moment'),
  path = require('path'),
  XLSX = require('xlsx'),
  IV_LENGTH = 16; // For AES

// Generate random number string for Stored Procedure set variables
const generateRandomStringForSP = () => {
  try {
    const randomStr = '_' + Date.now() + '_' + Math.floor(Math.random() * 200000);
    return randomStr;
  }
  catch(e) {
    logger.error(`helper:common generateRandomStringForSP() function => Error = `, e);
    throw e;
  }
}

// Generate random string
const generateRandomString = (randomStrLength = 4) => {
  try {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      charactersLength = characters.length;
    for ( let i = 0; i < randomStrLength; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  catch(e) {
    logger.error(`helper:common generateRandomString() function => Error = `, e);
    throw e;
  }
}

// Generate random number
const generateRandomNumber = (randomStrLength = 3) => {
  try {
    let result = '';
    const characters = '0123456789',
      charactersLength = characters.length;
    for ( let i = 0; i < randomStrLength; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return parseInt(result, 10);
  }
  catch(e) {
    logger.error(`helper:common generateRandomNumber() function => Error = `, e);
    throw e;
  }
}

// Generate password hash
// Library - CryptoJS (external)
const generateHash = (string) => {
  try {
    const hash = CryptoJS.MD5(string).toString();
    return hash;
  }
  catch(e) {
    logger.error(`helper:common generateHash() function => Error = `, e);
    throw e;
  }
}

// Encrypt with AES
// Library - CryptoJS (external)
const encrypt = (data, secretKey) => {
  try {
    // check for passed data error
    if(!data) throw new Error('Data required');
    if(!secretKey) throw new Error('Secret key required');

    // check if data is of Object
    if(typeof data === 'object') data = JSON.stringify(data);

    // encrypt
    const ciphertext = CryptoJS.AES.encrypt(data, secretKey);
    return ciphertext.toString();
  }
  catch(e) {
    logger.error(`helper:common encrypt() function => Data = ${data} Error = `, e);
    throw e;
  }
}

// Decrypt with AES
// Library - CryptoJS (external)
const decrypt = (data, secretKey) => {
  try {
    // check for passed data error
    if(!data) throw new Error('Data required');
    if(!secretKey) throw new Error('Secret key required');

    // decrypt
    const bytes = CryptoJS.AES.decrypt(data.toString(), secretKey);
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    return plaintext;
  }
  catch(e) {
    logger.error(`helper:common decrypt() function => Data = ${data} Error = `, e);
    throw e;
  }
}

// Encrypt with AES using IV
// Library - Crypto module (inbuilt)
const encryptWithIV = (data, secretKey, algorithm = 'aes-128-cbc') => {
  try {
    // check for passed data error
    if(!data) throw new Error('Data required');
    if(!secretKey) throw new Error('Secret key required');
    if(!algorithm) throw new Error('Algorithm required');

    // check if data is of Object
    if(typeof data === 'object') data = JSON.stringify(data);

    // encrypt data
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('base64') + ':' + encrypted.toString('base64');
  }
  catch(e) {
    logger.error(`helper:common encryptWithIV() function => Data = ${data} Error = `, e);
    throw e;
  }
}

// Decrypt with AES using IV
// Library - Crypto module (inbuilt)
const decryptWithIV = (data, secretKey, algorithm = 'aes-128-cbc') => {
  try {
    // check for passed data error
    if(!data) throw new Error('Data required');
    if(!secretKey) throw new Error('Secret key required');
    if(!algorithm) throw new Error('Algorithm required');

    // decrypt data
    const textParts = data.split(':'),
      iv = Buffer.from(textParts.shift(), 'base64'),
      encryptedText = Buffer.from(textParts.join(':'), 'base64'),
      decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
  }
  catch(e) {
    logger.error(`helper:common decryptWithIV() function => Data = ${data} Error = `, e);
    throw e;
  }
}

// Get Request IP Address
const getRequestIP = (req) => {
  try {
    const ip = (req.headers['x-forwarded-for'] || '').split(',').pop() || 
      req.connection.remoteAddress || 
      req.socket.remoteAddress || 
      req.connection.socket.remoteAddress;
    
    return ip;
  }
  catch(e) {
    logger.error(`helper:common getRequestIP() function => Error = `, e);
    throw e;
  }
}

// Make first letter of each word in string capital
const toTitleCase = (phrase) => {
  try {
    if(!phrase) return '';

    return phrase
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  catch(e) {
    logger.error(`helper:common toTitleCase() function => Error = `, e);
    throw e;
  }
}

// Check if object is empty
const isObjectEmpty = (obj) => {
  return (!obj || (typeof obj !== 'object') || (Object.keys(obj).length === 0));
}

// format date
const formatDate = (date, format = 'YYYY-MM-DD') => {
  try {
    return moment(new Date(date)).format(format);
  }
  catch(e) {
    logger.error(`helper:common formatDate() function => Error = `, e);
    throw e;
  }
}

// Get current timestamp
const getCurrentTimestamp = () => {
  return formatDate(Date.now(), 'YYYY-MM-DD HH:mm:ss');
}

// Rename file
const renameMulterFile = (originalFileName, prefix = 'file') => {
  try {
    const extension = path.extname(originalFileName);
    if(!extension || extension === '.') {
      throw new Error('Extension not found for file');
    }

    const newFileName = prefix + '-' + Date.now() + extension;
    return newFileName;
  }
  catch(e) {
    logger.error(`helper:common renameMulterFile() function => Error = `, e);
    return null;
  }
}

// Read excel file & return excel data
const readExcelFile = (filePath, worksheetName = 0) => {
  try {
    // read excel file
    const workbook = XLSX.readFile(filePath);
    if(!workbook) {
      return {
        error: true,
        message: 'Unable to read excel file'
      };
    }

    // Get first sheet name if work sheet name not provided
    if(!worksheetName) {
      worksheetName = workbook.SheetNames[0];
    }

    // Get worksheet
    const worksheet = workbook.Sheets[worksheetName];

    // convert worksheet to json
    const excelData = XLSX.utils.sheet_to_json(worksheet, {defval: ''});
    if(!excelData || !Array.isArray(excelData) || excelData.length === 0) {
      return {
        error: true,
        message: 'Excel file empty'
      };
    }

    // on success
    return {
      error: false,
      data: excelData
    };
  }
  catch(e) {
    logger.error(`helper:common readExcelFile() function => Error = `, e);
    return {
      error: true,
      message: 'Unable to read excel file'
    };
  }
}

// Create excel file & store in folder
const createExcelFile = (filePath, excelData, worksheetName = 'RECORDS') => {
  return new Promise((resolve, reject) => {
    try {
      // check for input errors
      // File path
      if(!filePath) {
        return resolve({
          error: true,
          message: 'Please provide file path'
        });
      }
      // Excel data
      if(!excelData || !Array.isArray(excelData) || excelData.length === 0) {
        return resolve({
          error: true,
          message: 'Please provide excel data array'
        });
      }
  
      // create new workbook
      const workbook = XLSX.utils.book_new();
  
      // create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);
      
      // write file
      XLSX.writeFileAsync(filePath, workbook, (e) => {
        // on error
        if(e) {
          logger.error(`helper:common createExcelFile() function => Error = `, e);
          return resolve({
            error: true,
            message: 'Unable to create excel file'
          });
        }

        // on success
        return resolve({error: false});
      });          
    }
    catch(e) {
      logger.error(`helper:common createExcelFile() function => Error = `, e);
      return resolve({
        error: true,
        message: 'Unable to create excel file'
      });
    }
  });
}

// For parsing excel date 
const parseExcelDate = (excelNumber) => {
  try {
    if(!excelNumber) return '';
    const convertedDateObj =  XLSX.SSF.parse_date_code(excelNumber);
    let {y, m, d} = convertedDateObj;
    m = m ? m.toString().padStart(2, '0') : '';
    d = d ? d.toString().padStart(2, '0') : '';
    return `${y}-${m}-${d}`;    
  }
  catch(e) {
    logger.error(`helper:common parseExcelDate() function => Error = `, e);
    return null;
  }
}

// Convert to upper case
// For SP call empty string is different
const convertToUpperCase = (str, forSPCall = false) => {
  let emptyStr = '';
  if(forSPCall) emptyStr = "''";

  return str ? str.toString().toUpperCase() : emptyStr;
}

// Convert to string
const convertToString = (str) => {
  return str ? str.toString() : '';
}

module.exports = {
  generateRandomStringForSP,
  generateRandomString,
  generateRandomNumber,
  generateHash,
  encrypt,
  decrypt,
  encryptWithIV,
  decryptWithIV,
  getRequestIP,
  toTitleCase,
  isObjectEmpty,
  formatDate,
  getCurrentTimestamp,
  renameMulterFile,
  readExcelFile,
  createExcelFile,
  parseExcelDate,
  convertToUpperCase,
  convertToString
};