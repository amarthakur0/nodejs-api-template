'use strict';

// Required modules
const reqlib = require('app-root-path').require,
  logger = reqlib('/helpers/logger'),
  SequelizeConn = new (reqlib('/db/sequelize/sequelize'))(),
  getMessage = reqlib('/constants/messages'),
  getErrorCode = reqlib('/constants/errorCodes');
const { getCurrentTimestamp } = reqlib('/helpers/common');
const { Op } = require('sequelize');

// Book Table related functions
class Book {
  constructor() {
    this.BookSchema = SequelizeConn.getSequelizeSchema().Book;
    this.somethingWrongMsg = getMessage['SOMETHING_WRONG'];
    this.successMsg = getMessage['SUCCESS'];
    this.dataNotFoundMsg = 'Book not found';
    this.dataNotFoundErrorCode = getErrorCode['DATA_NOT_FOUND'];
    this.sqlSelectFields = ['bookId', 'isbnNumber', 'bookName', 'bookSummary',
      'bookAuthor', 'publication', 'publishDate', 'createdDate'];
  }

  // Get Book details by Book Id
  async getByBookId(inputData) {
    try {
      const { bookId } = inputData;

      // Get book from DB
      const bookResult = await this.BookSchema.findOne({
        attributes: this.sqlSelectFields,
        where: { bookId, status: 'A' }
      });
      // Send error message
      if(!bookResult || !(bookResult instanceof this.BookSchema) || !bookResult.bookId) {
        return { error: true, errorCode: this.dataNotFoundErrorCode, message: this.dataNotFoundMsg };
      }

      // Book present
      return { error: false, message: 'Book found', data: { book: [bookResult] } };
    }
    catch(e) {
      logger.error(`sequelize:book getByBookId() function => Error = `, e);
      throw e;
    }
  }

  // Get Book details by ISBN Number
  async getByIsbnNumber(inputData) {
    try {
      const { isbnNumber } = inputData;

      // Get book from DB
      const bookResult = await this.BookSchema.findOne({
        attributes: this.sqlSelectFields.concat(['status']),
        where: { isbnNumber }
      });
      // Send error message
      if(!bookResult || !(bookResult instanceof this.BookSchema) || !bookResult.bookId) {
        return { error: true, errorCode: this.dataNotFoundErrorCode, message: this.dataNotFoundMsg };
      }

      // Book present
      return { error: false, message: 'Book found', data: { book: [bookResult] } };
    }
    catch(e) {
      logger.error(`sequelize:book getByIsbnNumber() function => Error = `, e);
      throw e;
    }
  }

  // Get All Books
  async getAll(inputData = {}) {
    try {
      // Get all books from DB
      const bookResult = await this.BookSchema.findAll({
        attributes: this.sqlSelectFields,
        where: { status: 'A' }
      });
      // Send error message
      if(!bookResult || bookResult.length === 0) {
        return { error: true, errorCode: this.dataNotFoundErrorCode, message: this.dataNotFoundMsg };
      }

      // Book present
      return { error: false, message: 'Books found', data: { book: bookResult } };
    }
    catch(e) {
      logger.error(`sequelize:book getAll() function => Error = `, e);
      throw e;
    }
  }

  // Get Books Listing by filter & pagination
  async getListing(inputData = {}) {
    try {
      // Input data
      let { isbnNumber, bookName, fromDate, toDate, pageNum, perPage } = inputData;
      // For Day start & end time
      const dayStartTime = ' 00:00:00',
        dayEndTime = ' 23:59:59';

      // For pagination
      pageNum = pageNum ? parseInt(pageNum, 10) : 1;
      perPage = perPage ? parseInt(perPage, 10) : 10;
      const limit = perPage,
        offset = (pageNum - 1) * perPage;

      // For Where Clause
      const whereClauseObj = { status: 'A' };
      // For ISBN Number
      if(isbnNumber) {
        whereClauseObj.isbnNumber = isbnNumber;
      }
      // For Book Name
      if(bookName) {
        whereClauseObj.bookName = {
          [Op.like]: bookName + '%'
        };
      }
      // For From & To Date
      whereClauseObj.createdDate = {
        [Op.between]: [(fromDate + dayStartTime), (toDate + dayEndTime)]
      };

      // Get books from DB
      const bookResult = await this.BookSchema.findAndCountAll({
        attributes: this.sqlSelectFields,
        where: whereClauseObj,
        order: [ ['bookId', 'DESC'] ],
        limit: limit,
        offset: offset
      });
      // Send error message
      if(!bookResult || !bookResult.rows || bookResult.rows.length === 0) {
        return { error: true, errorCode: this.dataNotFoundErrorCode, message: this.dataNotFoundMsg };
      }

      // Book present
      return { error: false, message: 'Books found', data: { count: bookResult.count, perPage, pageNum, book: bookResult.rows } };
    }
    catch(e) {
      logger.error(`sequelize:book getListing() function => Error = `, e);
      throw e;
    }
  }

  // Insert Book
  async insert(inputData) {
    try {
      const { isbnNumber, bookName, bookSummary, bookAuthor, publication, publishDate, loggedInUserId } = inputData;
      
      // Check if ISBN Number already present in Table
      const isbnCheckResult = await this.getByIsbnNumber({ isbnNumber });
      // Send error message
      if(!isbnCheckResult.error && isbnCheckResult.data.book.length > 0) {
        return { error: true, message: 'ISBN Number already exists' };
      }

      // Insert into table
      const insertResult = await this.BookSchema.create({
        isbnNumber, bookName, publishDate,
        bookSummary: bookSummary || null,
        bookAuthor: bookAuthor || null, 
        publication: publication || null,
        status: 'A', createdBy: loggedInUserId
      });
      if(!insertResult) {
        return { error: true, message: 'Unable to create Book' };
      }

      // Inserted Id
      const insertId = insertResult.id;

      // Send back Success response
      return {
        error: false,
        message: 'Book created',
        data: { insertId }
      };
    }
    catch(e) {
      logger.error(`sequelize:book insert() function => Error = `, e);
      throw e;
    }
  }

  // Update Book details
  async update(inputData) {
    try {
      const { bookId, bookName, bookSummary, bookAuthor, publication, publishDate, loggedInUserId } = inputData;

      // Check if Book present in Table
      const bookCheckResult = await this.getByBookId({ bookId });
      if(bookCheckResult.error) return bookCheckResult;

      // Update record
      const updateResult = await this.BookSchema.update(
        {
          bookName, publishDate,
          bookSummary: bookSummary || null,
          bookAuthor: bookAuthor || null, 
          publication: publication || null,
          modifiedBy: loggedInUserId,
          modifiedDate: getCurrentTimestamp()
        },
        { where: { bookId } }
      );
      if(!updateResult) {
        return { error: true, message: 'Unable to update Book' };
      }

      // Send back Success response
      return {
        error: false,
        message: 'Book updated',
        data: {}
      };
    }
    catch(e) {
      logger.error(`sequelize:book update() function => Error = `, e);
      throw e;
    }
  }

  // Delete Book
  async delete(inputData) {
    try {
      const { bookId, loggedInUserId } = inputData;

      // Check if Book present in Table
      const bookCheckResult = await this.getByBookId({ bookId });
      if(bookCheckResult.error) return bookCheckResult;

      // Update record
      const updateResult = await this.BookSchema.update(
        { status: 'I', modifiedBy: loggedInUserId, modifiedDate: getCurrentTimestamp() },
        { where: { bookId } }
      );
      if(!updateResult) {
        return { error: true, message: 'Unable to delete Book' };
      }

      // Send back Success response
      return {
        error: false,
        message: 'Book deleted',
        data: {}
      };
    }
    catch(e) {
      logger.error(`sequelize:book delete() function => Error = `, e);
      throw e;
    }
  }
}

module.exports = Book;