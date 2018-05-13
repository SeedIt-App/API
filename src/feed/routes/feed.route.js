const path = require('path');
const express = require('express');
const FeedMiddleware = require('../middlewares/feed.middleware');
const FeedController = require('../controllers/feed.controller');
const { authorize } = require(path.resolve('./src/auth/middlewares/auth.middleware'));

const router = express.Router();

router
  .route('/')
  /**
   * @api {get} v1/feeds List Posts as News feed
   * @apiDescription Get a list of news feed post
   * @apiVersion 0.0.1
   * @apiName NewsFeed
   * @apiGroup Feed
   * @apiPermission user
   *
   * @apiHeader {String} Athorization  User's access token
   *
   * @apiParam  {Number{1-}}      [page=1]      List page
   * @apiParam  {Number{1-100}}   [perPage=10]  Users per page
   * @apiParam  {Object}          [filter]      User's filter object [userName, email, role]
   *
   * @apiSuccess {Object[]} NewsFeed List of posts.
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated users can access the data
   * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
   */
  .get(authorize(), FeedMiddleware.query, FeedController.feeds);

router
  .route('/guest')
  /**
   * @api {get} v1/feeds Guest users news feed
   * @apiDescription Get a list of latest news feed post for guest users
   * @apiVersion 0.0.1
   * @apiName GuestNewsFeed
   * @apiGroup Feed
   * @apiPermission guest
   *
   * @apiParam  {Number{1-}}      [page=1]      List page
   * @apiParam  {Number{1-100}}   [perPage=10]  Users per page
   * @apiParam  {Object}          [filter]      User's filter object [userName, email, role]
   *
   * @apiSuccess {Object[]} NewsFeed List of posts.
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated users can access the data
   * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
   */
  .get(FeedMiddleware.query, FeedController.guestFeeds);

module.exports = router;
