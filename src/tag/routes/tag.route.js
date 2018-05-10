const path = require('path');
const express = require('express');
const validate = require('express-validation');
const TagMiddleware = require('../middlewares/tag.middleware');
const TagController = require('../controllers/tag.controller');
const { authorize, ADMIN, LOGGED_USER } = require(path.resolve('./src/auth/middlewares/auth.middleware'));
const TagValidation = require('../validations/tag.validation');

const router = express.Router();

/**
 * Load tag when API with tagId route parameter is hit
 */
router.param('tagId', TagController.load);

router
  .route('/')
  /**
   * @api {get} v1/tags List Tags
   * @apiDescription Get a list of tags
   * @apiVersion 0.0.1
   * @apiName ListTags
   * @apiGroup Tag
   * @apiPermission admin
   *
   * @apiHeader {String} Athorization  Admin's access token
   *
   * @apiParam  {Number{1-}}      [page=1]      List page
   * @apiParam  {Number{1-100}}   [perPage=10]  Tags per page
   * @apiParam  {Object}          [filter]      Tag's filter object [name]
   * @apiParam  {String}          [select]      Tag's select column names [name,followers,*]
   * @apiParam  {String}          [order]       Tag's list order by [createdAt, name]
   * @apiParam  {String=asc,desc} [sort]        Tag's order sort by [asc, desc]
   *
   * @apiSuccess {Object[]} tags List of tags.
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated tags can access the data
   * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
   */
  .get(authorize(ADMIN), validate(TagValidation.list), TagMiddleware.query, TagController.list)
  /**
   * @api {post} v1/tags Create Tag
   * @apiDescription Create a new tag
   * @apiVersion 0.0.1
   * @apiName CreateTag
   * @apiGroup Tag
   * @apiPermission admin
   *
   * @apiHeader {String} Athorization  Users's access token
   *
   * @apiParam  {String}          tag   Tag's name
   *
   * @apiSuccess (Created 201) {String}  id         Tag's id
   * @apiSuccess (Created 201) {String}  tag        Tag's name
   * @apiSuccess (Created 201) {String}  tagBy      Tag created by user
   * @apiSuccess (Created 201) {Date}    createdAt  Timestamp
   *
   * @apiError (Bad Request 400)   ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401)  Unauthorized     Only authenticated tags can create the data
   * @apiError (Forbidden 403)     Forbidden        Only admins can create the data
   */
  .post(authorize(ADMIN), validate(TagValidation.create), TagController.create);

router
  .route('/:tagId')
  /**
   * @api {get} v1/tags/:id Get Tag
   * @apiDescription Get tag information
   * @apiVersion 0.0.1
   * @apiName GetTag
   * @apiGroup Tag
   * @apiPermission tag
   *
   * @apiHeader {String} Athorization  User's access token
   *
   * @apiParam {Number} tagId Tags ID.
   *
   * @apiSuccess {String}  id         Tag's id
   * @apiSuccess {String}  tag        Tag's name
   * @apiSuccess {String}  tagBy      Tag created by user
   * @apiSuccess {Date}    createdAt  Timestamp
   *
   * @apiError (Unauthorized 401) Unauthorized Only authenticated tags can access the data
   * @apiError (Forbidden 403)    Forbidden    Only tag with same id or admins can access the data
   * @apiError (Not Found 404)    NotFound     Tag does not exist
   */
  .get(authorize(), TagController.get)
  /**
   * @api {patch} v1/tags/:id Update Tag
   * @apiDescription Update some fields of a tag document
   * @apiVersion 0.0.1
   * @apiName UpdateTag
   * @apiGroup Tag
   * @apiPermission Admin
   *
   * @apiHeader {String} Athorization  Admin's access token
   *
   * @apiParam {Number} tagId Tags ID.
   *
   * @apiParam  {String}    tag   Tag's name
   *
   * @apiSuccess {String}  id         Tag's id
   * @apiSuccess {String}  tag        Tag's name
   * @apiSuccess {String}  followers  Tag's followers
   * @apiSuccess {String}  tagby      Tag's create by user id
   * @apiSuccess {Date}    createdAt  Timestamp
   *
   * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated tags can modify the data
   * @apiError (Forbidden 403)    Forbidden    Only tag with same id or admins can modify the data
   * @apiError (Not Found 404)    NotFound     Tag does not exist
   */
  .patch(authorize(LOGGED_USER), validate(TagValidation.update), TagController.update)
  /**
   * @api {patch} v1/tags/:id Delete Tag
   * @apiDescription Delete a tag
   * @apiVersion 0.0.1
   * @apiName DeleteTag
   * @apiGroup Tag
   * @apiPermission tag
   *
   * @apiHeader {String} Athorization  Tag's access token
   *
   * @apiParam {Number} tagId Tags ID.
   *
   * @apiSuccess (No Content 204)  Successfully deleted
   *
   * @apiError (Unauthorized 401) Unauthorized  Only authenticated tags can delete the data
   * @apiError (Forbidden 403)    Forbidden     Only tag with same id or admins can delete the data
   * @apiError (Not Found 404)    NotFound      Tag does not exist
   */
  .delete(authorize(), TagController.remove);

router
  .route('/:tagId/follow')
  /**
   * @api {get} v1/tags/:tagId/follow/ Tag follow
   * @apiDescription Follow new tag
   * @apiVersion 0.0.1
   * @apiName TagFollow
   * @apiGroup Tag
   * @apiPermission tag
   *
   * @apiHeader {String} Athorization  Tag's access token
   *
   * @apiParam {Number} tagId following tag id.
   *
   * @apiSuccess {String}  message  User following :tagId tag now
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated Tags can access the data
   */
  .patch(authorize(), TagController.follow);

router
  .route('/:tagId/followers')
  /**
   * @api {get} v1/tags/followers Tag followers
   * @apiDescription Get all the Tag followers
   * @apiVersion 0.0.1
   * @apiName TagFollowers
   * @apiGroup Tag
   * @apiPermission User
   *
   * @apiHeader {String} Athorization  User's access token
   *
   * @apiParam  {ObjectId}  tagId     Tag id to get all followers
   *
   * @apiSuccess {String}  firstName  Tag following users firstName
   * @apiSuccess {String}  lastName  Tag following users lastName
   * @apiSuccess {String}  userName  Tag following users userName
   * @apiSuccess {String}  email  Tag following users email
   * @apiSuccess {String}  photo  Tag following users photo
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated Tags can access the data
   */
  .get(authorize(), TagController.followers);

module.exports = router;
