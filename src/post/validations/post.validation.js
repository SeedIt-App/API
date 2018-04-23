const Joi = require('joi');

module.exports = {
  // POST /v1/post/create
  create: {
    body: {
      text: Joi.string().required().min(8).max(500),
    },
  },
};
