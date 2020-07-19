'use strict';

// Required modules
const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
  // Define Model
  class UserAuthToken extends Model {};

  UserAuthToken.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      field: 'id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    authToken: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      field: 'auth_token'
    },
    refreshToken: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'refresh_token'
    },
    jwtId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'jwt_id'
    },
    source: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      field: 'source',
      defaultValue: 1,
      comment: '1 = Web, 2 = Android'
    },
    status: {
      type: DataTypes.STRING(1),
      allowNull: false,
      field: 'status',
      defaultValue: 'A',
      comment: 'A = Active, I = Inactive'
    },
    tokenExpiry: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'token_expiry'
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_date',
      defaultValue: Sequelize.NOW
    }
  }, {
    sequelize,
    modelName: 'UserAuthToken',
    tableName: 'user_auth_token',
    timestamps: false,
    indexes: [
      { name: 'unq_user_id', unique: true, fields: ['userId'] }
    ]
  });

  return UserAuthToken;
};