'use strict';

// Required modules
const mongoose = require('mongoose'),
  reqlib = require('app-root-path').require,
  logger = reqlib('/helpers/logger'),
  getMessage = reqlib('/constants/messages'),
  getErrorCode = reqlib('/constants/errorCodes'),
  bookSchema = reqlib('/db/mongo/schema/book');
// Crate model
const BookModel = mongoose.model('book', bookSchema);

// Book related functions
class Book {
  constructor() {
    this.somethingWrongMsg = getMessage['SOMETHING_WRONG'];
    this.successMsg = getMessage['SUCCESS'];
    this.dataNotFoundMsg = 'Book not found';
    this.dataNotFoundErrorCode = getErrorCode['DATA_NOT_FOUND'];
    this.selectFields = 'isbnNumber bookName bookSummary bookAuthor publication publishDate createdDate';
  }

  // Get Book details by Book Id (_id)
  async getByBookId(inputData) {
    try {
      const { bookId } = inputData;

      // Get book from DB
      const bookResult = await BookModel.findById(bookId).select(this.selectFields).lean().exec();
      // Send error message
      if(!bookResult || Object.keys(bookResult).length === 0) {
        return { error: true, errorCode: this.dataNotFoundErrorCode, message: this.dataNotFoundMsg };
      }

      // Book present
      return { error: false, message: 'Book found', data: { book: [bookResult] } };
    }
    catch(e) {
      logger.error(`mongo:book getByBookId() function => Error = `, e);
      throw e;
    }
  }

  // Get Book details by ISBN Number
  async getByIsbnNumber(inputData) {
    try {
      const { isbnNumber } = inputData;

      // Get book from DB
      const bookResult = await BookModel.findOne({ isbnNumber }).select(this.selectFields + ' status').lean().exec();
      // Send error message
      if(!bookResult || Object.keys(bookResult).length === 0) {
        return { error: true, errorCode: this.dataNotFoundErrorCode, message: this.dataNotFoundMsg };
      }

      // Book present
      return { error: false, message: 'Book found', data: { book: [bookResult] } };
    }
    catch(e) {
      logger.error(`mongo:book getByIsbnNumber() function => Error = `, e);
      throw e;
    }
  }

  // Get All Books
  async getAll(inputData = {}) {
    try {
      // Get book from DB
      const bookResult = await BookModel.find({ status: 'A' }).select(this.selectFields).lean().exec();
      // Send error message
      if(!bookResult || bookResult.length === 0) {
        return { error: true, errorCode: this.dataNotFoundErrorCode, message: this.dataNotFoundMsg };
      }

      // Book present
      return { error: false, message: 'Books found', data: { book: bookResult } };
    }
    catch(e) {
      logger.error(`mongo:book getAll() function => Error = `, e);
      throw e;
    }
  }

  // Insert Book
  async insert(inputData) {
    try {
      const { isbnNumber, bookName, bookSummary, bookAuthor, publication, publishDate, loggedInUserId } = inputData;
      
      // Check if ISBN Number already present
      const isbnCheckResult = await this.getByIsbnNumber({ isbnNumber });
      // Send error message
      if(!isbnCheckResult.error && isbnCheckResult.data.book.length > 0) {
        return { error: true, message: 'ISBN Number already exists' };
      }

      // Create Book
      const insertResult = await BookModel.create({
        isbnNumber, bookName, bookSummary, bookAuthor, publication, publishDate,
        status: 'A'
      });
      // Check error
      if(!insertResult) {
        return { error: true, message: 'Unable to create Book' };
      }

      // Inserted Id
      const insertId = insertResult._id;

      // Send back Success response
      return {
        error: false,
        message: 'Book created',
        data: { insertId }
      };
    }
    catch(e) {
      logger.error(`mongo:book insert() function => Error = `, e);
      throw e;
    }
  }

  // Update Book details
  async update(inputData) {
    try {
      const { bookId, bookName, bookSummary, bookAuthor, publication, publishDate, loggedInUserId } = inputData;

      // Check if Book present
      const bookCheckResult = await this.getByBookId({ bookId });
      if(bookCheckResult.error) return bookCheckResult;

      // Update Book
      const updateResult = await BookModel.updateOne({ _id: bookId }, 
        { $set: { bookName, bookSummary, bookAuthor, publication, publishDate, modifiedDate: Date.now() } });
      // Check error
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
      logger.error(`mongo:book update() function => Error = `, e);
      throw e;
    }
  }

  // Delete Book
  async delete(inputData) {
    try {
      const { bookId, loggedInUserId } = inputData;

      // Check if Book present
      const bookCheckResult = await this.getByBookId({ bookId });
      if(bookCheckResult.error) return bookCheckResult;

      // Update record
      const updateResult = await await BookModel.updateOne({ _id: bookId }, { status: 'I', modifiedDate: Date.now() });
      // Check error
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
      logger.error(`mongo:book delete() function => Error = `, e);
      throw e;
    }
  }
}

module.exports = Book;