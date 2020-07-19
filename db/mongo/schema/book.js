'use strict';

// Required modules
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

// Define book schema
const bookSchema = new Schema({
  isbnNumber: { type: String, trim: true, required: true },
  bookName: { type: String, trim: true, required: true },
  bookSummary: { type: String, trim: true },
  bookAuthor: { type: String, trim: true },
  publication: { type: String, trim: true },
  publishDate: { type: Date, trim: true, required: true, default: Date.now },
  status: { type: String, trim: true, default: 'A' },
  createdBy: Schema.Types.ObjectId,
  createdDate: { type: Date, trim: true, default: Date.now },
  modifiedBy: Schema.Types.ObjectId,
  modifiedDate: { type: Date, trim: true }
});

// Set indexes
bookSchema.index({ isbnNumber: 1 }, { unique: true });

module.exports = bookSchema;