'use strict';

// Required modules
const multer  = require('multer'),
  appRoot = require('app-root-path'),
  reqlib = appRoot.require,
  logger = reqlib('/helpers/logger');
// For setting error response
const { setErrorResponse } = reqlib('/helpers/response');
const { renameMulterFile } = reqlib('/helpers/common');

// error messages
const unableToUpload = 'Unable to upload file';

// Multer error messages
const multerErrorMessages = {
  'LIMIT_PART_COUNT': 'Too many parts',
  'LIMIT_FILE_SIZE': 'File too large',
  'LIMIT_FILE_COUNT': 'Too many files',
  'LIMIT_FIELD_KEY': 'Field name too long',
  'LIMIT_FIELD_VALUE': 'Field value too long',
  'LIMIT_FIELD_COUNT': 'Too many fields',
  'LIMIT_UNEXPECTED_FILE': 'Unexpected field'
};

// Image file filter
const imageFileFilter = (req, file, cb) => {
  // supported image file mimetypes
  const allowedMimes = ['image/jpeg', 'image/png'];
  
  if (allowedMimes.includes(file.mimetype)) {
    // allow supported image files
    cb(null, true);
  }
  else {
    // throw error for invalid files
    cb(new Error('Invalid file type. Only jpg & png image files are allowed.'));
  }
};

// Excel file filter
const excelFileFilter = (req, file, cb) => {
  // supported excel file mimetypes
  const allowedMimes = [
    'application/vnd.ms-excel', // for .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // for .xlsx
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    // allow supported excel files
    cb(null, true);
  }
  else {
    // throw error for invalid files
    cb(new Error('Invalid file type. Only xls & xlsx files are allowed.'));
  }
};

// Allow any file
const allowAnyFile = (req, file, cb) => {
  cb(null, true);
};

// Rename File
const renameFile = (masterName, fieldname) => {
  let renameFilePrefix = fieldname;
  switch(masterName) {
    case 'BOOK': 
      renameFilePrefix = 'book-' + fieldname;
      break;
    default:
      break;
  }

  return renameFilePrefix;
}

// Handle Single File Upload
const singleFileUpload = (inputParam) => {
  return (req, res, next) => {
    // skip to last/response middleware
    if(res.locals._TMP.skipToLastMiddleware) return next();
  
    try {
      const inputFieldName = inputParam.inputFieldName || 'image',
        fileType = inputParam.fileType || 'IMAGE',
        masterName = inputParam.masterName || 'BOOK',
        uploadFolder = inputParam.uploadFolder || 'book',
        maxFileSize = inputParam.maxFileSize || 100 * 1024; // Max file size 100 kb      

      // Storage for multer
      const uploadFolderFullPath = appRoot + '/uploads/' + uploadFolder;
      const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, uploadFolderFullPath);
        },
        filename: function (req, file, cb) {
          const originalFileName = file.originalname;
          const fieldname = file.fieldname;

          // Rename file prefix
          const renameFilePrefix = renameFile(masterName, fieldname);

          // check for error in rename
          const newFileName = renameMulterFile(originalFileName, renameFilePrefix);
          if(!newFileName) {
            return cb(new Error('File renaming failed'));
          }

          cb(null, newFileName);
        }
      });

      // Limits for multer
      const limits = {
        files: 1, // allow only 1 file per request
        fileSize: maxFileSize, // max file size
      };

      // File filter
      let fileFilter = allowAnyFile;
      // For image
      if(fileType === 'IMAGE') {
        fileFilter = imageFileFilter;
      }
      // For excel
      else if(fileType === 'EXCEL') {
        fileFilter = excelFileFilter;
      }
      
      // multer upload object
      const upload = multer({
        storage: storage,
        limits: limits,
        fileFilter: fileFilter
      }).single(inputFieldName);

      // Upload file now to specific folder
      upload(req, res, (err) => {
        // set is upload to Y if not set
        let isUpload = req.body.isUpload;
        if(!isUpload) isUpload = 'Y';

        if(err instanceof multer.MulterError) {
          logger.error(`middleware:singleFileUpload => Error = `, err);

          // A Multer error occurred when uploading
          const errorMsg = multerErrorMessages[err.code] || unableToUpload;
          return setErrorResponse(res, next, errorMsg, 400);
        }
        else if(err) {
          logger.error(`middleware:singleFileUpload => Error = `, err);

          // An unknown error occurred when uploading
          const errorMsg = err.message || unableToUpload;
          return setErrorResponse(res, next, errorMsg, 400);
        }
        else if(isUpload === 'Y' && (!req.file || !req.file.filename)) {
          // File not passed
          return setErrorResponse(res, next, 'Please upload file', 400);
        }

        // upload success
        return next();
      });
    }
    catch(e) {
      logger.error(`middleware:singleFileUpload => Error = `, e);
      return setErrorResponse(res, next, unableToUpload, 400);
    }
  };
};

module.exports = {
  singleFileUpload
};