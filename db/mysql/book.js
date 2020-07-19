'use strict';

// Required modules
const reqlib = require('app-root-path').require,
  logger = reqlib('/helpers/logger'),
  MySQLDB = new (reqlib('/db/mysql/mysql'))(),
  getMessage = reqlib('/constants/messages'),
  getErrorCode = reqlib('/constants/errorCodes');

// Book Table related functions
class Book {
  constructor() {
    this.tableName = 'book';
    this.somethingWrongMsg = getMessage['SOMETHING_WRONG'];
    this.successMsg = getMessage['SUCCESS'];
    this.dataNotFoundMsg = 'Book not found';
    this.dataNotFoundErrorCode = getErrorCode['DATA_NOT_FOUND'];
    this.dateFormatYMD = '%Y-%m-%d';
    this.sqlSelectFields = `book_id AS bookId, isbn_number AS isbnNumber, book_name AS bookName,
      book_summary AS bookSummary, book_author AS bookAuthor, publication,
      DATE_FORMAT(publish_date, '${this.dateFormatYMD}') AS publishDate,
      DATE_FORMAT(created_date, '${this.dateFormatYMD}') AS createdDate`;
  }

  // Get Book details by Book Id
  async getByBookId(inputData) {
    try {
      const { bookId } = inputData;

      // Get book from DB
      const selectSqlString = `SELECT ${this.sqlSelectFields}
        FROM \`${this.tableName}\` 
        WHERE book_id = ? AND status = 'A' LIMIT 1`,
        selectSqlData = [bookId],
        bookResult = await MySQLDB.preparedQuery(selectSqlString, selectSqlData);
      // Send error message
      if(!bookResult || bookResult.length === 0 || !bookResult[0].bookId) {
        return { error: true, errorCode: this.dataNotFoundErrorCode, message: this.dataNotFoundMsg };
      }

      // Book present
      return { error: false, message: 'Book found', data: { book: [bookResult[0]] } };
    }
    catch(e) {
      logger.error(`mysql:book getByBookId() function => Error = `, e);
      throw e;
    }
  }

  // Get Book details by ISBN Number
  async getByIsbnNumber(inputData) {
    try {
      const { isbnNumber } = inputData;

      // Get book from DB
      const selectSqlString = `SELECT ${this.sqlSelectFields}, status
        FROM \`${this.tableName}\` 
        WHERE isbn_number = ? LIMIT 1`,
        selectSqlData = [isbnNumber],
        bookResult = await MySQLDB.preparedQuery(selectSqlString, selectSqlData);
      // Send error message
      if(!bookResult || bookResult.length === 0 || !bookResult[0].bookId) {
        return { error: true, errorCode: this.dataNotFoundErrorCode, message: this.dataNotFoundMsg };
      }

      // Book present
      return { error: false, message: 'Book found', data: { book: [bookResult[0]] } };
    }
    catch(e) {
      logger.error(`mysql:book getByIsbnNumber() function => Error = `, e);
      throw e;
    }
  }

  // Get All Books
  async getAll(inputData = {}) {
    try {
      // Get all books from DB
      const selectSqlString = `SELECT ${this.sqlSelectFields}
        FROM \`${this.tableName}\` 
        WHERE status = 'A'`,
        selectSqlData = [],
        bookResult = await MySQLDB.preparedQuery(selectSqlString, selectSqlData);
      // Send error message
      if(!bookResult || bookResult.length === 0) {
        return { error: true, errorCode: this.dataNotFoundErrorCode, message: this.dataNotFoundMsg };
      }

      // Book present
      return { error: false, message: 'Books found', data: { book: bookResult } };
    }
    catch(e) {
      logger.error(`mysql:book getAll() function => Error = `, e);
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

      // Build Insert Query & Data
      const insertSqlString = `INSERT INTO \`${this.tableName}\` 
        (isbn_number, book_name, book_summary, book_author, publication, publish_date, status, created_by) 
        VALUES(?,?,?,?,?,?,?,?)`;
      const insertSqlData = [
        isbnNumber, bookName, bookSummary || '', bookAuthor || '',
        publication || '', publishDate, 'A', loggedInUserId
      ];

      // Insert into table
      const insertResult = await MySQLDB.preparedQuery(insertSqlString, insertSqlData);
      if(!insertResult) {
        return { error: true, message: 'Unable to create Book' };
      }

      // Inserted Id
      const insertId = insertResult.insertId;

      // Send back Success response
      return {
        error: false,
        message: 'Book created',
        data: { insertId }
      };
    }
    catch(e) {
      logger.error(`mysql:book insert() function => Error = `, e);
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

      // Build Update Query & Data
      const updateSqlString = `UPDATE \`${this.tableName}\` SET book_name = ?, book_summary = ?, book_author = ?,
        publication = ?, publish_date = ?, modified_by = ?, modified_date = ?
        WHERE book_id = ?`;
      const updateSqlData = [
        bookName, bookSummary || '', bookAuthor || '', publication || '',
        publishDate, loggedInUserId, MySQLDB.getCurrentTimestamp(), bookId
      ];

      // Update record
      const updateResult = await MySQLDB.preparedQuery(updateSqlString, updateSqlData);
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
      logger.error(`mysql:book update() function => Error = `, e);
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

      // Build Update Query & Data
      const updateSqlString = `UPDATE \`${this.tableName}\` SET status = ?, modified_by = ?, modified_date = ?
        WHERE book_id = ?`;
      const updateSqlData = ['I', loggedInUserId, MySQLDB.getCurrentTimestamp(), bookId];

      // Update record
      const updateResult = await MySQLDB.preparedQuery(updateSqlString, updateSqlData);
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
      logger.error(`mysql:book delete() function => Error = `, e);
      throw e;
    }
  }
}

module.exports = Book;