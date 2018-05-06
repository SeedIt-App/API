const httpStatus = require('http-status');
const Post = require('../models/post.model');
const PostEvent = require('../event/post.event');

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
          fromUser: req.user._id,
          resource: {
            name: 'post',
            id: post._id,
          },
          notificationType: 'mention',
        });

        /**
         * Subscribe the mentioned users for future notifications
         */
        post.subscribe(user._id);
      });
    });

    /**
     * Notify all followers about this new post
     * @type {Void}
     */
    req.user.notifyFollowers({
      fromUser: req.user._id,
      resource: {
        name: 'post',
        id: post._id,
      },
      streamId: post.stream ? post.stream : false,
      notificationType: 'feed',
      config: {
        avoidEmail: true,
      },
    });

    /**
     * Notify mentioned tag followers
     */
    post.getMentionedTags((err, tags) => {
      tags.map((tag) => {
        /**
         * Notify the tag followers
         */
        tag.notify({
          fromUser: req.user._id,
          resource: {
            name: 'post',
            id: post._id,
          },
          notificationType: 'feed',
        });

        /**
         * Add mentioned tags to the post
         */
        post.tags(tag._id);
      });
    });

    // save the changes in post
    post.save();

    // TODO: event trigger for new post in news-feed
    // event.trigger('newpost', { post: post, actor: req.user });

    /**
     *  trigger create post event
     */
    PostEvent.emit('create', {
      user: req.user._id,
      resource: {
        name: 'post',
        id: post._id,
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
