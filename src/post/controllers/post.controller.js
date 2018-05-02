const httpStatus = require('http-status');
const Post = require('../models/post.model');

/**
 * Create a new post
 * @param  {Object} req Request
 * @param  {Object} res Response
 * @return {Void}
 */
exports.create = async (req, res, next) => {
  try {
    // save new post
    let post = await (new Post(req.body)).save();
    // after
    post = post.afterSave(req.user);
    /**
     * Notify mentioned users
     */
    post.getMentionedUsers((err, users) => {
      users.map((user) => {
        /**
         * Notify the mentioned users
         */
        user.notify({
          actorId: req.user._id,
          postId: post._id,
          notificationType: 'mention',
        });

        /**
         * Subscribe the mentioned users for future notifications
         */
        post.subscribe(user._id);
        post.save();
      });
    });
    // TODO: event trigger for new post in news-feed
    // event.trigger('newpost', { post: post, actor: req.user });

    /**
     * Notify all followers about this new post
     * @type {Void}
     */
    req.user.notifyFollowers({
      postId: post._id,
      streamId: post.stream ? post.stream : false,
      notificationType: 'feed',
      config: {
        avoidEmail: true,
        systemLevel: true,
      },
    });
    // post response
    const postTransformed = post.transform();
    res.status(httpStatus.CREATED);
    return res.json(postTransformed);
  } catch (error) {
    return next(error);
  }
};
