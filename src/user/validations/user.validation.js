const Joi = require('joi');
const User = require('../models/user.model');

module.exports = {

  // GET /v1/users
  list: {
    query: {
      page: Joi.number().min(1),
      perPage: Joi.number().min(1).max(100),
      select: Joi.string().required(),
      order: Joi.string(),
      sort: Joi.string().valid(['asc', 'desc']),
    },
  },

  // POST /v1/users
  create: {
    body: {
      firstName: Joi.string().allow(''),
      lastName: Joi.string().allow(''),
      userName: Joi.string().required().min(4).max(16),
      email: Joi.string().email().required(),
      password: Joi.string().required().min(6).max(128),
      phone: Joi.number().required(),
      gender: Joi.string().valid(User.enum.gender),
      role: Joi.string().valid(User.enum.roles),
      birthDate: Joi.string().required(),
    },
  },

  // PUT /v1/users/:userId
  replace: {
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(128).required(),
      firstName: Joi.string().allow(''),
      lastName: Joi.string().allow(''),
      role: Joi.string().valid(User.enum.roles),
    },
    params: {
      userId: Joi.string().regex(/^[a-fA-F0-9]{24}$/).required(),
    },
  },

  // PATCH /v1/users/:userId
  update: {
    body: {
      email: Joi.string().email(),
      password: Joi.string().min(6).max(128),
      firstName: Joi.string().allow(''),
      lastName: Joi.string().allow(''),
      role: Joi.string().valid(User.enum.roles),
    },
    params: {
      userId: Joi.string().regex(/^[a-fA-F0-9]{24}$/).required(),
    },
  },
};
