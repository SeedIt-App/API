const mongoose = require('mongoose');
const UserEnum = require('./user.enum');

/**
 * User Schema
 * @private
 */
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    maxlength: 64,
    trim: true,
  },
  lastName: {
    type: String,
    maxlength: 64,
    trim: true,
  },
  userName: {
    type: String,
    required: true,
    trim: true,
    index: true,
    unique: true,
  },
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 128,
  },
  phone: {
    type: Number,
    index: true,
    unique: true,
    maxlength: 10,
  },
  gender: {
    type: String,
    enum: UserEnum.gender,
    default: 'other',
  },
  birthDate: {
    type: Date,
  },
  serviceProvider: {
    type: String,
    enum: UserEnum.provider,
    default: 'local',
  },
  services: {
    facebook: mongoose.Schema.Types.Mixed,
    google: mongoose.Schema.Types.Mixed,
    twitter: mongoose.Schema.Types.Mixed,
  },
  role: {
    type: String,
    enum: UserEnum.roles,
    default: 'user',
  },
  picture: {
    type: String,
    trim: true,
  },
  activateToken: {
    type: String,
  },
  activeFlag: {
    type: Boolean,
    default: false,
  },
  deleteFlag: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

/**
 * export the schema
 */
module.exports = UserSchema;
