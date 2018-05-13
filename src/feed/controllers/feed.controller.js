const path = require('path');
const httpStatus = require('http-status');
// const User = require(path.resolve('./src/user/models/user.model'));
const Tag = require(path.resolve('./src/tag/models/tag.model'));
const Post = require(path.resolve('./src/post/models/post.model'));

/**
 * Logged in users NewsFeed
 */
exports.feeds = async (req, res, next) => {
  try {
    const { user } = req;
    // add user followings created post
    const criteria = {
      postedBy: { $in: user.followings.concat(user._id) },
    };
    // add user following tags in criteria
    const userTags = await Tag.userTags(user._id);
    if (userTags) {
      criteria.tags = { $in: userTags };
    }
    // add request query & timestamp
    if (req.query && req.query.timestamp) {
      criteria.created = { $gte: req.query.timestamp };
    }
    // add query filter
    if (req.query && req.query.filter) {
      delete criteria.created;
      criteria.content = new RegExp(req.query.filter, 'i');
    }
    /**
     * Find all the post for news feed
     */
    Post.find(criteria, null, { sort: { created: -1 } })
      .populate('creator')
      .populate('waters')
      .populate('comments.creator')
      .skip(req.query.page * req.query.perPage)
      .limit(req.query.perPage)
      .exec((err, posts) => {
        if (err) {
          return next(err);
        }

        const morePages = req.query.perPage < posts.length;
        if (morePages) {
          posts.pop();
        }
        posts.map((e) => {
          e.afterSave(req.user, req.query.limitComments);
        });
        res.status(httpStatus.OK);
        res.json({
          records: posts,
          morePages,
        });
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Guest user NewsFeed
 * @public
 */
exports.guestFeeds = async (req, res, next) => {
  try {
    const criteria = {};
    if (req.query && req.query.timestamp) {
      criteria.created = { $gte: req.query.timestamp };
    }
    if (req.query && req.query.filter) {
      delete criteria.created;
      criteria.content = new RegExp(req.query.filter, 'i');
    }
    Post.find(criteria, null, { sort: { created: -1 } })
      .populate('creator')
      .populate('waters')
      .populate('comments.creator')
      .skip(req.query.page * req.query.perPage)
      .limit(req.query.perPage)
      .exec((err, posts) => {
        if (err) {
          return next(err);
        }

        const morePages = req.query.perPage < posts.length;
        if (morePages) {
          posts.pop();
        }
        posts.map((e) => {
          e.afterSave(req.user, req.query.limitComments);
        });
        res.status(httpStatus.OK);
        res.json({
          records: posts,
          morePages,
        });
      });
  } catch (error) {
    next(error);
  }
};
