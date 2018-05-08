const path = require('path');
const router = require('express').Router();
const validate = require('express-validation');
const PostController = require('../controllers/post.controller');
const PostValidation = require('../validations/post.validation');
const PostMiddleware = require('../middlewares/post.middleware');
const { authorize } = require(path.resolve('./src/auth/middlewares/auth.middleware'));

/**
 * Load user when API with userId route parameter is hit
 */
router.param('postId', PostController.load);

router.route('/')
  /**
   * @api {post} v1/posts Post Create
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
  .post(authorize(), validate(PostValidation.create), PostController.create)
  /**
   * @api {get} v1/posts List loggedin user created post
   * @apiDescription List Logged in user created posts
   * @apiVersion 0.0.1
   * @apiName List
   * @apiGroup Post
   * @apiPermission public
   *
   * @apiParam  {Number{1-}}      [page=1]      List page
   * @apiParam  {Number{1-100}}   [perPage=10]  Posts per page
   * @apiParam  {Object}          [filter]      Post's filter object []
   * @apiParam  {String}          [select]      Post's select column names [firstName,email,*]
   * @apiParam  {String}          [order]       Post's list order by [createdAt, firstName]
   * @apiParam  {String=asc,desc} [sort]        Post's order sort by [asc, desc]
   *
   * @apiSuccess {Object[]} Post List of users.
   *
   * @apiError (Bad Request 400)  BadRequest  Some parameters may contain invalid values
   */
  .get(authorize(), validate(PostValidation.list), PostMiddleware.query, PostController.list);

router.route('/:postId/water')
  /**
   * @api {patch} v1/posts/:postId/water Water Post
   * @apiDescription Water Post by logged in user
   * @apiVersion 0.0.1
   * @apiName PostWater
   * @apiGroup Post
   * @apiPermission public
   *
   * @apiParam  {String}          text     Post's text
   * @apiParam  {String{6..128}}  images   Post images if uploaded
   *
   * @apiSuccess (200) {String}   message  Water added successfully
   *
   * @apiError (Bad Request 400)  BadRequest  Some parameters may contain invalid values
   */
  .patch(authorize(), PostController.water)
  /**
   * @api {get} v1/posts/:postId/water List watered users for post
   * @apiDescription List Logged in user created posts
   * @apiVersion 0.0.1
   * @apiName List
   * @apiGroup Post
   * @apiPermission public
   *
   * @apiParam  {Number{1-}}      [page=1]      List page
   * @apiParam  {Number{1-100}}   [perPage=10]  Posts per page
   * @apiParam  {Object}          [filter]      Post's filter object []
   * @apiParam  {String}          [select]      Post's select column names [firstName,email,*]
   * @apiParam  {String}          [order]       Post's list order by [createdAt, firstName]
   * @apiParam  {String=asc,desc} [sort]        Post's order sort by [asc, desc]
   *
   * @apiSuccess {Object[]} Post List of users.
   *
   * @apiError (Bad Request 400)  BadRequest  Some parameters may contain invalid values
   */
  .get(authorize(), PostController.waters);

router.route('/:postId/comment')
  /**
   * @api {patch} v1/posts/:postId/comment Comment on Post
   * @apiDescription Comment on post
   * @apiVersion 0.0.1
   * @apiName PostComment
   * @apiGroup Post
   * @apiPermission public
   *
   * @apiParam  {String}          text     Post's text
   *
   * @apiSuccess (200) {String}   message  Comment added successfully
   *
   * @apiError (Bad Request 400)  BadRequest  Some parameters may contain invalid values
   */
  .patch(authorize(), validate(PostValidation.comment), PostController.comment)
  /**
   * @api {patch} v1/posts/:postId/comment Get all Comment on Post
   * @apiDescription Get all Comment on post
   * @apiVersion 0.0.1
   * @apiName PostComment
   * @apiGroup Post
   * @apiPermission public
   *
   * @apiParam  {ObjectId}        id     Post Id
   * @apiParam  {Number}          limit   comment limit
   * @apiParam  {Number}          offset  comment start offset
   * @apiSuccess {Object[]}       array  List of post comments.
   *
   * @apiError (Bad Request 400)  BadRequest  Some parameters may contain invalid values
   */
  .get(authorize(), PostController.comments);

router.route('/:postId/comment/:commentId')
  /**
   * @api {patch} v1/posts/:postId/comment/:commentId Reply to the Comment on Post
   * @apiDescription Reply to the Comment on Post
   * @apiVersion 0.0.1
   * @apiName PostCommentReply
   * @apiGroup Post
   * @apiPermission public
   *
   * @apiParam  {String}          text     Post's text
   *
   * @apiSuccess (200) {String}   message  Comment added successfully
   *
   * @apiError (Bad Request 400)  BadRequest  Some parameters may contain invalid values
   */
  .patch(authorize(), validate(PostValidation.reply), PostController.reply)
  /**
   * @api {patch} v1/posts/:postId/comment Get all replies for Comment on Post
   * @apiDescription Get all replies for Comment on post
   * @apiVersion 0.0.1
   * @apiName PostCommentReply
   * @apiGroup Post
   * @apiPermission public
   *
   * @apiParam  {ObjectId}        id     Post Id
   * @apiParam  {Number}          limit   comment limit
   * @apiParam  {Number}          offset  comment start offset
   * @apiSuccess {Object[]}       array  List of post comments.
   *
   * @apiError (Bad Request 400)  BadRequest  Some parameters may contain invalid values
   */
  .get(authorize(), PostController.replies);

module.exports = router;
