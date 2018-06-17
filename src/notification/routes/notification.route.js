const path = require('path');
const router = require('express').Router();
const validate = require('express-validation');
const NotificationController = require('../controllers/notification.controller');
const NotificationValidation = require('../validations/notification.validation');
const NotificationMiddleware = require('../middlewares/notification.middleware');
const { authorize } = require(path.resolve('./src/auth/middlewares/auth.middleware'));

/**
 * Load user when API with userId route parameter is hit
 */
router.param('notificationId', NotificationController.load);

router.route('/')
  /**
   * @api {get} v1/notifications List of notification
   * @apiDescription List of notifications
   * @apiVersion 0.0.1
   * @apiName ListNotification
   * @apiGroup Notification
   * @apiPermission user
   *
   * @apiHeader {String} Athorization  User's access token
   *
   * @apiParam  {Number{1-}}      [page=1]      List page
   * @apiParam  {Number{1-100}}   [perPage=10]  Notifications per page
   * @apiParam  {Object}          [filter]      Notification's filter object []
   * @apiParam  {String}          [order]       Notification's list order by [createdAt, toUser]
   * @apiParam  {String=asc,desc} [sort]        Notification's order sort by [asc, desc]
   *
   * @apiSuccess {Object[]} Notification List of users.
   *
   * @apiError (Bad Request 400)  BadRequest  Some parameters may contain invalid values
   */
  .get(
    authorize(),
    validate(NotificationValidation.list),
    NotificationMiddleware.query,
    NotificationController.list,
  );


module.exports = router;
