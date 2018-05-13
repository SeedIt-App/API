const express = require('express');
const validate = require('express-validation');
const AuthController = require('../controllers/auth.controller');
const AuthValidation = require('../validations/auth.validation');
const oAuthLogin = require('../middlewares/auth.middleware').oAuth;

const router = express.Router();

/**
 * @api {post} api/v1/auth/register Register
 * @apiDescription Register a new user
 * @apiVersion 0.0.1
 * @apiName Register
 * @apiGroup Auth
 * @apiPermission public
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
 * @apiSuccess (Created 201) {String}  token.tokenType     Access Token's type
 * @apiSuccess (Created 201) {String}  token.accessToken   Authorization Token
 * @apiSuccess (Created 201) {String}  token.refreshToken  Token to get
 *                                                         a new accessToken after expiration time
 * @apiSuccess (Created 201) {Number}  token.expiresIn     Access Token's
 *                                                         expiration time in miliseconds
 * @apiSuccess (Created 201) {String}  token.timezone      The server's Timezone
 *
 * @apiSuccess (Created 201) {String}  user.id         User's id
 * @apiSuccess (Created 201) {String}  user.name       User's name
 * @apiSuccess (Created 201) {String}  user.email      User's email
 * @apiSuccess (Created 201) {String}  user.role       User's role
 * @apiSuccess (Created 201) {Date}    user.createdAt  Timestamp
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 */
router.route('/register')
  .post(validate(AuthValidation.register), AuthController.register);


/**
 * @api {post} v1/auth/login Login
 * @apiDescription Get an accessToken
 * @apiVersion 0.0.1
 * @apiName Login
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}         usernameOrEmail  User's username or email
 * @apiParam  {String{..128}}  password         User's password
 *
 * @apiSuccess  {String}  token.tokenType     Access Token's type
 * @apiSuccess  {String}  token.accessToken   Authorization Token
 * @apiSuccess  {String}  token.refreshToken  Token to get a new accessToken
 *                                                   after expiration time
 * @apiSuccess  {Number}  token.expiresIn     Access Token's expiration time
 *                                                   in miliseconds
 *
 * @apiSuccess  {String}  user.id             User's id
 * @apiSuccess  {String}  user.name           User's name
 * @apiSuccess  {String}  user.email          User's email
 * @apiSuccess  {String}  user.role           User's role
 * @apiSuccess  {Date}    user.createdAt      Timestamp
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized     Incorrect email or password
 */
router.route('/login')
  .post(validate(AuthValidation.login), AuthController.login);


/**
 * @api {post} v1/auth/refresh Refresh Token
 * @apiDescription Refresh expired accessToken
 * @apiVersion 0.0.1
 * @apiName RefreshToken
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}  email         User's email
 * @apiParam  {String}  refreshToken  Refresh token aquired when user logged in
 *
 * @apiSuccess {String}  tokenType     Access Token's type
 * @apiSuccess {String}  accessToken   Authorization Token
 * @apiSuccess {String}  refreshToken  Token to get a new accessToken after expiration time
 * @apiSuccess {Number}  expiresIn     Access Token's expiration time in miliseconds
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized     Incorrect email or refreshToken
 */
router.route('/refresh')
  .post(validate(AuthValidation.refresh), AuthController.refresh);

/**
 * @api {post} v1/auth/forgot Forgot password
 * @apiDescription Forgot password request to generate reset token to update user password
 * @apiVersion 0.0.1
 * @apiName ForgotPassword
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}    email     User's email address
 *
 * @apiSuccess {String}   message   Reset token sent to registered email
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized     Incorrect email
 */
router.route('/forgot')
  .post(validate(AuthValidation.forgot), AuthController.forgot);

/**
 * @api {post} v1/auth/reset Reset user forgot Password
 * @apiDescription Reset user password with new password
 * @apiVersion 0.0.1
 * @apiName ResetPassword
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}  resetToken    User's reset password token
 * @apiParam  {String}  newPassword   New Password
 *
 * @apiSuccess {String}  message      Password reset success message
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized     Incorrect resetToken
 */
router.route('/reset')
  .post(validate(AuthValidation.reset), AuthController.reset);

/**
 * @api {post} v1/auth/facebook Facebook Login
 * @apiDescription Login with facebook. Creates a new user if it does not exist
 * @apiVersion 0.0.1
 * @apiName FacebookLogin
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}  access_token  Facebook's access_token
 *
 * @apiSuccess {String}  tokenType     Access Token's type
 * @apiSuccess {String}  accessToken   Authorization Token
 * @apiSuccess {String}  refreshToken  Token to get a new accessToken after expiration time
 * @apiSuccess {Number}  expiresIn     Access Token's expiration time in miliseconds
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized    Incorrect access_token
 */
router.route('/facebook')
  .post(validate(AuthValidation.oAuth), oAuthLogin('facebook'), AuthController.oAuth);

/**
 * @api {post} v1/auth/google Google Login
 * @apiDescription Login with google. Creates a new user if it does not exist
 * @apiVersion 0.0.1
 * @apiName GoogleLogin
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}  access_token  Google's access_token
 *
 * @apiSuccess {String}  tokenType     Access Token's type
 * @apiSuccess {String}  accessToken   Authorization Token
 * @apiSuccess {String}  refreshToken  Token to get a new accpessToken after expiration time
 * @apiSuccess {Number}  expiresIn     Access Token's expiration time in miliseconds
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized    Incorrect access_token
 */
router.route('/google')
  .post(validate(AuthValidation.oAuth), oAuthLogin('google'), AuthController.oAuth);

module.exports = router;
