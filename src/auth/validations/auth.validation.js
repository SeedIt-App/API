const path = require('path');
const Joi = require('joi');
const User = require(path.resolve('./src/user/models/user.model'));

module.exports = {
  // POST /v1/auth/register
  register: {
    body: {
      firstName: Joi.string().allow(''),
      lastName: Joi.string().allow(''),
      userName: Joi.string().required().min(4).max(16),
      email: Joi.string().email().required(),
      password: Joi.string().required().min(6).max(128),
      phone: Joi.number().required(),
      gender: Joi.string().valid(User.enum.gender),
      birthDate: Joi.string().required(),
    },
  },

  // POST /v1/auth/login
  login: {
    body: {
      usernameOrEmail: Joi.string().required(),
      password: Joi.string().required().max(128),
    },
  },

  // POST /v1/auth/facebook
  // POST /v1/auth/google
  oAuth: {
    body: {
      access_token: Joi.string().required(),
    },
  },

  // POST /v1/auth/refresh-token
  refresh: {
    body: {
      email: Joi.string().email().required(),
      refreshToken: Joi.string().required(),
    },
  },

  // POST /v1/auth/forgot
  forgot: {
    body: {
      email: Joi.string().email().required(),
    },
  },

  // POST /v1/auth/reset
  reset: {
    body: {
      resetToken: Joi.string().required(),
      newPassword: Joi.string().required().min(6).max(128),
    },
  },
};
