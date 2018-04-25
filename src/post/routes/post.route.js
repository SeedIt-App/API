const path = require('path');
const router = require('express').Router();
const validate = require('express-validation');
const controller = require('../controllers/post.controller');
const { create } = require('../validations/post.validation');
const middleware = require('../middlewares/post.middleware');

const { authorize } = require(path.resolve('./src/auth/middlewares/auth'));

/**
 * @api {post} v1/post/create Create
 * @apiDescription Create new post
 * @apiVersion 0.0.1
 * @apiName Create
 * @apiGroup Post
 * @apiPermission public
 *
 * @apiParam  {String}          text     Post's text
 * @apiParam  {String{6..128}}  images   Post images if uploaded
 *
 * @apiSuccess (Created 201) {String}  text       Post text
 * @apiSuccess (Created 201) {String}  images     Post images
 * @apiSuccess (Created 201) {String}  location   Post user location
 * @apiSuccess (Created 201) {Object}  postedBy   Post user object (name, username, image)
 * @apiSuccess (Created 201) {Array}   comments   Post comments Array
 * @apiSuccess (Created 201) {Array}   tags       Post tags Array
 * @apiSuccess (Created 201) {Array}   waters     Post water user array
 * @apiSuccess (Created 201) {Array}   levels     Post levels
 * @apiSuccess (Created 201) {Date}    createdAt  Timestamp
 *
 * @apiError (Bad Request 400)  BadRequest  Some parameters may contain invalid values
 */
router.route('/create')
  .post(authorize(), validate(create), middleware.location, controller.create);

module.exports = router;
