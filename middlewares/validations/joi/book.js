'use strict';

// This file will contain book joi related validation schema 
const joi = require('@hapi/joi');
const {
  getIdError,
  getTextCheckError,
  validateDateError
} = require('./common.js');

// For ISBN Number
const isbnNumberError = getTextCheckError('ISBN number', 10, 20);

// For Book Name
const bookNameError = getTextCheckError('Book name', 1, 100);

// For Book Summary
const bookSummaryError = getTextCheckError('Book summary', 0, 500, false);

// For Book Author
const bookAuthorError = getTextCheckError('Book author', 0, 100, false);

// For Publication
const publicationError = getTextCheckError('Publication', 0, 100, false);

// For Publish Date
const publishDateError = validateDateError('Publish date');

// For Book Id
const bookIdError = getIdError('Book Id');

// For Book Create API
const createBookApiSchema = joi.object().keys({
  isbnNumber: isbnNumberError,
  bookName: bookNameError,
  bookSummary: bookSummaryError,
  bookAuthor: bookAuthorError,
  publication: publicationError,
  publishDate: publishDateError
});

// For Book Update API
const updateBookApiSchema = joi.object().keys({
  bookId: bookIdError,
  bookName: bookNameError,
  bookSummary: bookSummaryError,
  bookAuthor: bookAuthorError,
  publication: publicationError,
  publishDate: publishDateError
});

// For checking only Book id
const onlyBookIdSchema = joi.object().keys({
  bookId: bookIdError
});

module.exports = {
  createBookApiSchema,
  updateBookApiSchema,
  onlyBookIdSchema
};