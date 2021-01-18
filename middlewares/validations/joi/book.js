'use strict';

// This file will contain book joi related validation schema 
const joi = require('@hapi/joi');
const {
  getIdError,
  getTextCheckError,
  validateDateError,
  compareDateError
} = require('./common.js');

// For ISBN Number
const isbnNumberError = getTextCheckError('ISBN number', 10, 20);

// For ISBN Number Optional
const isbnNumberOptionalError = getTextCheckError('ISBN number', 0, 20, false);

// For Book Name
const bookNameError = getTextCheckError('Book name', 1, 100);

// For Book Name Optional
const bookNameOptionalError = getTextCheckError('Book name', 0, 100, false);

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

// For From Date
const fromDateError = validateDateError('From Date');

// For To Date
const toDateError = compareDateError('To Date', 'fromDate');

// For Page Number
const pageNumError = getIdError('Page number', false);

// For Per Page
const perPageError = getIdError('Per page', false);

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

// For Book Listing API
const bookListingApiSchema = joi.object().keys({
  isbnNumber: isbnNumberOptionalError,
  bookName: bookNameOptionalError,
  fromDate: fromDateError,
  toDate: toDateError,
  pageNum: pageNumError,
  perPage: perPageError
});

module.exports = {
  createBookApiSchema,
  updateBookApiSchema,
  onlyBookIdSchema,
  bookListingApiSchema
};