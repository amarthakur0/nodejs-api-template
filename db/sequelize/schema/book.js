'use strict';

// Required modules
const { Sequelize, DataTypes, Model } = require('sequelize'),
  reqlib = require('app-root-path').require,
  { formatDate } = reqlib('/helpers/common');

module.exports = (sequelize) => {
  // Define Model
  class Book extends Model {};

  Book.init({
    bookId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      field: 'book_id'
    },
    isbnNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'isbn_number'
    },
    bookName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'book_name'
    },
    bookSummary: {
      type: DataTypes.STRING(500),
      field: 'book_summary',
      defaultValue: null
    },
    bookAuthor: {
      type: DataTypes.STRING(100),
      field: 'book_author',
      defaultValue: null
    },
    publication: {
      type: DataTypes.STRING(100),
      field: 'publication',
      defaultValue: null
    },
    publishDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'publish_date'
    },
    status: {
      type: DataTypes.STRING(1),
      allowNull: false,
      field: 'status',
      defaultValue: 'A',
      comment: 'A = Active, I = Inactive'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by'
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_date',
      defaultValue: Sequelize.NOW,
      get() { return formatDate(this.getDataValue('createdDate'), 'YYYY-MM-DD HH:mm:ss'); }
    },
    modifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'modified_by',
      defaultValue: 0
    },
    modifiedDate: {
      type: DataTypes.DATE,
      field: 'modified_date',
      defaultValue: null
    }
  }, {
    sequelize,
    modelName: 'Book',
    tableName: 'book',
    timestamps: false,
    indexes: [
      { name: 'unq_isbn_number', unique: true, fields: ['username'] }
    ]
  });

  return Book;
};