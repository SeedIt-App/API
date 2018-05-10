const Joi = require('joi');

module.exports = {

  // GET /v1/tags
  list: {
    query: {
      page: Joi.number().min(1),
      perPage: Joi.number().min(1).max(100),
      select: Joi.string().required(),
      order: Joi.string(),
      sort: Joi.string().valid(['asc', 'desc']),
    },
  },

  // POST /v1/tags
  create: {
    body: {
      tag: Joi.string().required().min(2).max(120),
    },
  },

  // PATCH /v1/tags/:tagId
  update: {
    body: {
      tag: Joi.string().required().min(2).max(120),
    },
  },

};
