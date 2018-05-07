const Joi = require('joi');

module.exports = {
  // GET /v1/posts
  list: {
    query: {
      page: Joi.number().min(1),
      perPage: Joi.number().min(1).max(100),
      select: Joi.string().required(),
      order: Joi.string(),
      sort: Joi.string().valid(['asc', 'desc']),
    },
  },

  // POST /v1/posts
  create: {
    body: {
      text: Joi.string().required().min(8).max(500),
    },
  },
};
