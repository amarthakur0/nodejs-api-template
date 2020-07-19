'use strict';

// Required modules
const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  // Define Model
  class User extends Model {};

  User.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      field: 'user_id'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'username'
    },
    emailId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'email_id'
    },
    mobileNo: {
      type: DataTypes.STRING(15),
      field: 'mobile_no',
      defaultValue: null
    },
    displayName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'display_name'
    },
    password: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'password'
    },
    status: {
      type: DataTypes.STRING(1),
      allowNull: false,
      field: 'status',
      defaultValue: 'A',
      comment: 'A = Active, I = Inactive'
    },
    lastLoginTime: {
      type: DataTypes.DATE,
      field: 'last_login_time',
      defaultValue: null
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
      defaultValue: Sequelize.NOW
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
    modelName: 'User',
    tableName: 'user',
    timestamps: false,
    indexes: [
      { name: 'unq_username', unique: true, fields: ['username'] },
      { name: 'unq_email_id', unique: true, fields: ['emailId'] },
      { name: 'idx_status', fields: ['status'] }
    ]
  });

  return User;
};