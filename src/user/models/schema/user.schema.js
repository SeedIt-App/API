const mongoose = require('mongoose');
const UserEnum = require('../../utils/user.enum');

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
  followings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  bio: {
    type: String,
  },
  picture: {
    type: String,
    trim: true,
  },
  address: {
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
    },
    zip: {
      type: Number,
      minlength: 5,
      maxlength: 5,
    },
  },
  badges: [],
  notifications: {
    mail: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
  },
  devices: [{
    deviceId: String,
    deviceType: String,
  }],
  socketId: {
    type: String,
  },
  resetToken: {
    type: String,
  },
  resetExpireAt: {
    type: Date,
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

UserSchema.index({ deleteFlag: 1, username: 1, createdAt: -1 });
UserSchema.index({ deleteFlag: 1, email: 1, createdAt: -1 });

/**
 * export the schema
 */
module.exports = UserSchema;
