const httpStatus = require('http-status');
const Post = require('../models/post.model');
const PostEvent = require('../event/post.event');

/**
 * Load post and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
  try {
    const post = await Post.get(id);
    req.locals = { post };
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single post
 * @return post object
 */
exports.get = async (req, res) => {
  if (req.locals && req.locals.post) {
    return res.send(req.locals.post);
  }
  return {};
};

/**
 * Create a new post
 * @param  {Object} req Request
 * @param  {Object} res Response
 * @return {Void}
 */
exports.create = async (req, res, next) => {
  try {
    // add posted by user
    req.body.postedBy = req.user._id;
    // save new post
    let post = await (new Post(req.body)).save();
    // after
    post = post.afterSave(req.user);
    /**
     * Notify mentioned users
     */
    post.getMentionedUsers((err, users) => {
      if (err) {
        return next(err);
      }
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
        post.subscribe(user);
        // save the changes in post
        post.save();
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
      if (err) {
        return next(err);
      }
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
        post.tags.addToSet(tag);
        // save the changes in post
        post.save();
      });
    });

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

/**
 * Post list of user loggedin
 * @param {*} req
 * @param {*} res
 * @param {*} next Next function
 */
exports.list = async (req, res, next) => {
  try {
    // regex to search the post list
    if (req.query.filter && req.query.filter.search) {
      req.query.filter.text = {
        $regex: new RegExp(`${req.query.filter.search}`, 'i'),
      };
      // remove the search from filter
      delete req.query.filter.search;
    }

    // take the count by filter queries
    const count = await Post.count(req.query.filter);
    const posts = await Post.list(req.query);
    res.json({
      count,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User timeline
 * @param {*} req
 * @param {*} res
 * @param {*} next Next function
 */
exports.timeline = async (req, res, next) => {
  try {
    // add the query posted by loggedin user
    req.query.filter = (req.query.filter) ? req.query.filter : {};
    req.query.filter.postedBy = req.user._id;
    const count = await Post.count({ postedBy: req.query.filter.postedBy });
    const posts = await Post.list(req.query);
    res.json({
      count,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Water Post by user loggedin
 * @param {*} req
 * @param {*} res
 * @param {*} next Next function
 */
exports.water = async (req, res, next) => {
  try {
    const { post } = req.locals;
    // check user has already watered in post
    const index = post.waters.indexOf(req.user._id);
    if (index > -1) {
      // remove user from waters to unwater from post
      post.waters.splice(index, 1);
      // save the post with removed user
      await post.save();
      return res.json({
        message: 'Water removed from the post',
      });
    }
    post.waters.push(req.user._id);
    // Notify post owner for new water
    post.notifyActions({
      fromUser: req.user._id,
      resource: {
        name: 'post',
        id: post._id,
      },
      notificationType: 'water',
      config: { avoidEmail: true }, // avoid email notification for water
    });
    // save the post with new water array
    await post.save();
    // return the response with message
    return res.json({
      message: 'Water added to the post',
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Post list of water users
 * @param {*} req
 * @param {*} res
 * @param {*} next Next function
 */
exports.waters = async (req, res, next) => {
  try {
    const { waters } = await Post.findById(req.locals.post._id).populate('waters', req.query.select.split(',')).exec();
    return res.json({
      waters,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Comment on the post
 * @param {*} req
 * @param {*} res
 * @param {*} next Next function
 */
exports.comment = async (req, res, next) => {
  try {
    // get post
    const { post } = req.locals;
    // add commented by user id
    const comment = req.body;
    comment.commentBy = req.user._id;
    // push the new comment to post comments
    post.comments.push(comment);
    // Notify post owner for new comment
    post.notifyActions({
      fromUser: req.user._id,
      resource: {
        name: 'post',
        id: post._id,
      },
      notificationType: 'comment',
      config: { avoidEmail: true }, // avoid email notification for comment
    });
    // save the post with new comment array
    await post.save();
    // return the response with message
    return res.json({
      message: 'Comment added to the post',
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * List of comments
 * @param {*} req
 * @param {*} res
 * @param {*} next Next function
 */
exports.comments = (req, res, next) => {
  try {
    Post.findById(req.locals.post._id)
      .populate({
        path: 'comments.commentBy',
        model: 'User',
        select: ['email', 'userName', 'firstName', 'lastName', 'picture'],
      })
      .exec()
      .then((data) => {
        let { comments } = data;
        // get the total count of comments
        const commentsCount = comments.length;
        // check for comment limit and slice the data
        if (req.query.limit && commentsCount > req.query.limit) {
          if (req.query.offset) {
            comments = comments.slice(req.query.offset, req.query.limit);
          } else {
            comments = comments.slice(0, req.query.limit);
          }
        }
        return res.json({
          commentsCount,
          comments,
        });
      });
  } catch (error) {
    return next(error);
  }
};

/**
 * Reply on the post comment
 * @param {*} req
 * @param {*} res
 * @param {*} next Next function
 */
exports.reply = async (req, res, next) => {
  try {
    // get post
    const { post } = req.locals;
    // get the comment from the post
    const comment = post.commentById(req.params.commentId);
    // check the comment is valid
    if (!comment) {
      throw new Error('No comments found in the post');
    }
    // add commented by user id
    comment.replies.push({
      text: req.body.text,
      replyBy: req.user._id,
    });
    // reply added to the comment
    post.replaceComment(comment);
    // Notify post owner for new reply
    post.notifyActions({
      fromUser: req.user._id,
      resource: {
        name: 'post',
        id: post._id,
      },
      notificationType: 'reply',
      config: { avoidEmail: true }, // avoid email notification for comment reply
    });
    // save the post with new reply to comment array
    await post.save();
    // return the response with message
    return res.json({
      message: 'Reply added to the post comment',
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * List of comment replies
 * @param {*} req
 * @param {*} res
 * @param {*} next Next function
 */
exports.replies = (req, res, next) => {
  try {
    Post.findById(req.locals.post._id)
      .populate({
        path: 'comments.replies.replyBy',
        model: 'User',
        select: ['email', 'userName', 'firstName', 'lastName', 'picture'],
      })
      .exec()
      .then((data) => {
        const comment = data.commentById(req.params.commentId);
        // get only the replies
        let { replies } = comment;
        // get the total count of replies
        const repliesCount = replies.length;
        // check for reply limit and slice the data
        if (req.query.limit && repliesCount > req.query.limit) {
          if (req.query.offset) {
            replies = replies.slice(req.query.offset, req.query.limit);
          } else {
            replies = replies.slice(0, req.query.limit);
          }
        }
        return res.json({
          repliesCount,
          replies,
        });
      })
      .catch((error) => {
        // return the error to next function
        next(error);
      });
  } catch (error) {
    return next(error);
  }
};
