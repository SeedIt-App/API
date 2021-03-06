const path = require('path');
const express = require('express');
const validate = require('express-validation');
const UserMiddleware = require('../middlewares/user.middleware');
const UserController = require('../controllers/user.controller');
const { authorize, LOGGED_USER } = require(path.resolve('./src/auth/middlewares/auth.middleware'));
const UserValidation = require('../validations/user.validation');

const router = express.Router();

/**
 * Load user when API with userId route parameter is hit
 */
router.param('userId', UserController.load);


router
  .route('/')
  /**
   * @api {get} v1/users List Users
   * @apiDescription Get a list of users
   * @apiVersion 0.0.1
   * @apiName ListUsers
   * @apiGroup User
   * @apiPermission admin
   *
   * @apiHeader {String} Athorization  User's access token
   *
   * @apiParam  {Number{1-}}      [page=1]      List page
   * @apiParam  {Number{1-100}}   [perPage=10]  Users per page
   * @apiParam  {Object}          [filter]      User's filter object [userName, email, role]
   * @apiParam  {String}          [select]      User's select column names [firstName,email,*]
   * @apiParam  {String}          [order]       User's list order by [createdAt, firstName]
   * @apiParam  {String=asc,desc} [sort]        User's order sort by [asc, desc]
   *
   * @apiSuccess {Object[]} users List of users.
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated users can access the data
   * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
   */
  .get(authorize(), validate(UserValidation.list), UserMiddleware.query, UserController.list)
  /**
   * @api {post} v1/users Create User
   * @apiDescription Create a new user
   * @apiVersion 0.0.1
   * @apiName CreateUser
   * @apiGroup User
   * @apiPermission admin
   *
   * @apiHeader {String} Athorization  User's access token
   *
   * @apiParam  {String}          firstName   User's first name
   * @apiParam  {String}          lastName    User's last name
   * @apiParam  {String}          userName    User's username should be unique
   * @apiParam  {String}          email       User's email
   * @apiParam  {String{6..128}}  password    User's password
   * @apiParam  {Number}          phone       User's phone number
   * @apiParam  {String}          gender      User's gender
   * @apiParam  {Date}            birthDate   User's birth date in (YYYY-MM-DD) format
   *
   * @apiSuccess (Created 201) {String}  id         User's id
   * @apiSuccess (Created 201) {String}  name       User's name
   * @apiSuccess (Created 201) {String}  email      User's email
   * @apiSuccess (Created 201) {String}  role       User's role
   * @apiSuccess (Created 201) {Date}    createdAt  Timestamp
   *
   * @apiError (Bad Request 400)   ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401)  Unauthorized     Only authenticated users can create the data
   * @apiError (Forbidden 403)     Forbidden        Only admins can create the data
   */
  .post(authorize(), validate(UserValidation.create), UserController.create);


router
  .route('/profile')
  /**
   * @api {get} v1/users/profile User Profile
   * @apiDescription Get logged in user profile information
   * @apiVersion 0.0.1
   * @apiName UserProfile
   * @apiGroup User
   * @apiPermission user
   *
   * @apiHeader {String} Athorization  User's access token
   *
   * @apiSuccess {String}  id         User's id
   * @apiSuccess {String}  name       User's name
   * @apiSuccess {String}  email      User's email
   * @apiSuccess {String}  role       User's role
   * @apiSuccess {Date}    createdAt  Timestamp
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated Users can access the data
   */
  .get(authorize(), UserController.profile);

router
  .route('/follow/:userId')
  /**
   * @api {get} v1/users/follow/:id User follow
   * @apiDescription Follow other user
   * @apiVersion 0.0.1
   * @apiName UserFollow
   * @apiGroup User
   * @apiPermission user
   *
   * @apiHeader {String} Athorization  User's access token
   *
   * @apiParam {Number} userId following user id.
   *
   * @apiSuccess {String}  message         User following :userid user now
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated Users can access the data
   */
  .get(authorize(), UserController.follow);

router
  .route('/followers')
  /**
   * @api {get} v1/users/follow/:id Get User followers List
   * @apiDescription Follow other user
   * @apiVersion 0.0.1
   * @apiName UserFollowersList
   * @apiGroup User
   * @apiPermission user
   *
   * @apiHeader {String} Athorization  User's access token
   *
   * @apiParam  {Number{1-}}      [page=1]      List page
   * @apiParam  {Number{1-100}}   [perPage=10]  Users per page
   * @apiParam  {Object}          [filter]      Follower's filter object [userName, email, role]
   * @apiParam  {String}          [select]      Follower's select column names [firstName,email,*]
   * @apiParam  {String}          [order]       Follower's list order by [createdAt, firstName]
   * @apiParam  {String=asc,desc} [sort]        Follower's order sort by [asc, desc]
   *
   * @apiSuccess {String}  message         User following :userid user now
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated Users can access the data
   */
  .get(authorize(), validate(UserValidation.list), UserMiddleware.query, UserController.followers);

router
  .route('/followings')
  /**
   * @api {get} v1/users/follow/:id Get User followings List
   * @apiDescription Follow other user
   * @apiVersion 0.0.1
   * @apiName UserFollowingsList
   * @apiGroup User
   * @apiPermission user
   *
   * @apiHeader {String} Athorization  User's access token
   *
   * @apiParam  {Number{1-}}      [page=1]      List page
   * @apiParam  {Number{1-100}}   [perPage=10]  Users per page
   * @apiParam  {Object}          [filter]      Following's filter object [userName, email, role]
   * @apiParam  {String}          [select]      Following's select column names [firstName,email,*]
   * @apiParam  {String}          [order]       Following's list order by [createdAt, firstName]
   * @apiParam  {String=asc,desc} [sort]        Following's order sort by [asc, desc]
   *
   * @apiSuccess {String}  message         User following :userid user now
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated Users can access the data
   */
  .get(authorize(), validate(UserValidation.list), UserMiddleware.query, UserController.followings);

router
  .route('/:userId')
  /**
   * @api {get} v1/users/:id Get User
   * @apiDescription Get user information
   * @apiVersion 0.0.1
   * @apiName GetUser
   * @apiGroup User
   * @apiPermission user
   *
   * @apiHeader {String} Athorization  User's access token
   *
   * @apiParam {Number} userId Users ID.
   *
   * @apiSuccess {String}  id         User's id
   * @apiSuccess {String}  name       User's name
   * @apiSuccess {String}  email      User's email
   * @apiSuccess {String}  role       User's role
   * @apiSuccess {Date}    createdAt  Timestamp
   *
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can access the data
   * @apiError (Forbidden 403)    Forbidden    Only user with same id or admins can access the data
   * @apiError (Not Found 404)    NotFound     User does not exist
   */
  .get(authorize(), UserController.get)
  /**
   * @api {put} v1/users/:id Replace User
   * @apiDescription Replace the whole user document with a new one
   * @apiVersion 0.0.1
   * @apiName ReplaceUser
   * @apiGroup User
   * @apiPermission user
   *
   * @apiHeader {String} Athorization  User's access token
   *
   * @apiParam {Number} userId Users ID.
   *
   * @apiParam  {String}          firstName   User's first name
   * @apiParam  {String}          lastName    User's last name
   * @apiParam  {String}          userName    User's username should be unique
   * @apiParam  {String}          email       User's email
   * @apiParam  {String{6..128}}  password    User's password
   * @apiParam  {Number}          phone       User's phone number
   * @apiParam  {String}          gender      User's gender
   * @apiParam  {Date}            birthDate   User's birth date in (YYYY-MM-DD) format
   * @apiParam  {String=user,admin}  [role]    User's role
   * (You must be an admin to change the user's role)
   *
   * @apiSuccess {String}  id         User's id
   * @apiSuccess {String}  name       User's name
   * @apiSuccess {String}  email      User's email
   * @apiSuccess {String}  role       User's role
   * @apiSuccess {Date}    createdAt  Timestamp
   *
   * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can modify the data
   * @apiError (Forbidden 403)    Forbidden    Only user with same id or admins can modify the data
   * @apiError (Not Found 404)    NotFound     User does not exist
   */
  .put(authorize(LOGGED_USER), validate(UserValidation.replace), UserController.replace)
  /**
   * @api {patch} v1/users/:id Update User
   * @apiDescription Update some fields of a user document
   * @apiVersion 0.0.1
   * @apiName UpdateUser
   * @apiGroup User
   * @apiPermission user
   *
   * @apiHeader {String} Athorization  User's access token
   *
   * @apiParam {Number} userId Users ID.
   *
   * @apiParam  {String}          firstName   User's first name
   * @apiParam  {String}          lastName    User's last name
   * @apiParam  {String}          userName    User's username should be unique
   * @apiParam  {String}          email       User's email
   * @apiParam  {String{6..128}}  password    User's password
   * @apiParam  {Number}          phone       User's phone number
   * @apiParam  {String}          gender      User's gender
   * @apiParam  {Date}            birthDate   User's birth date in (YYYY-MM-DD) format
   * @apiParam  {String=user,admin}  [role]    User's role
   * (You must be an admin to change the user's role)
   *
   * @apiSuccess {String}  id         User's id
   * @apiSuccess {String}  name       User's name
   * @apiSuccess {String}  email      User's email
   * @apiSuccess {String}  role       User's role
   * @apiSuccess {Date}    createdAt  Timestamp
   *
   * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can modify the data
   * @apiError (Forbidden 403)    Forbidden    Only user with same id or admins can modify the data
   * @apiError (Not Found 404)    NotFound     User does not exist
   */
  .patch(authorize(LOGGED_USER), validate(UserValidation.update), UserController.update)
  /**
   * @api {patch} v1/users/:id Delete User
   * @apiDescription Delete a user
   * @apiVersion 0.0.1
   * @apiName DeleteUser
   * @apiGroup User
   * @apiPermission user
   *
   * @apiHeader {String} Athorization  User's access token
   *
   * @apiParam {Number} userId Users ID.
   *
   * @apiSuccess (No Content 204)  Successfully deleted
   *
   * @apiError (Unauthorized 401) Unauthorized  Only authenticated users can delete the data
   * @apiError (Forbidden 403)    Forbidden     Only user with same id or admins can delete the data
   * @apiError (Not Found 404)    NotFound      User does not exist
   */
  .delete(authorize(), UserController.remove);

module.exports = router;
