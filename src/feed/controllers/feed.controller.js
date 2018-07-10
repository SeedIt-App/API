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
    const criteria = [];
    // add user followings created post
    criteria.push({
      postedBy: { $in: user.followings.concat(user._id) },
    });
    // add user following tags in criteria
    const userTags = await Tag.userTags(user._id);
    if (userTags) {
      const userTagsId = [];
      userTags.map((t) => {
        userTagsId.push(t._id);
      });
      criteria.push({ tags: { $in: userTagsId } });
    }
    // add request query & timestamp
    // if (req.query && req.query.timestamp) {
    //   criteria.created = { $gte: req.query.timestamp };
    // }

    // regex to search the users newsfeed
    if (req.query.filter && req.query.filter.search) {
      req.query.filter.text = {
        $regex: new RegExp(`${req.query.filter.search}`, 'i'),
      };
      // remove the search from filter
      delete req.query.filter.search;
    }

    /**
     * Find all the post for news feed
     */
    Post.find(req.query.filter)
      .or(criteria)
      .select(req.query.select)
      .populate('tags', req.query.with.tags)
      .populate('postedBy', req.query.with.postedBy)
      .populate('waters', req.query.with.waters)
      .populate('subscribers', req.query.with.subscribers)
      .populate({
        path: 'comments.commentBy',
        model: 'User',
        select: req.query.with.commentBy,
      })
      .populate({
        path: 'comments.replies.replyBy',
        model: 'User',
        select: req.query.with.replyBy,
      })
      .sort(req.query.sortBy)
      .skip((req.query.page - 1) * req.query.perPage)
      .limit(req.query.perPage)
      .exec((err, posts) => {
        if (err) {
          return next(err);
        }

        const morePosts = req.query.perPage < posts.length;
        if (morePosts) {
          posts.pop();
        }
        posts.map((e) => {
          e.afterSave(req.user, req.query.limitComments);
        });
        res.status(httpStatus.OK);
        res.json({
          records: posts,
          morePosts,
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
    let criteria = {};
    if (req.query && req.query.timestamp) {
      criteria.createdAt = { $gte: req.query.timestamp };
    }
    if (req.query && req.query.filter) {
      delete criteria.createdAt;
      // criteria.content = new RegExp(req.query.filter, 'i');
      criteria = req.query.filter;
    }
    Post.find(criteria)
      .select(req.query.select)
      .populate('tags', req.query.with.tags)
      .populate('postedBy', req.query.with.postedBy)
      .populate('waters', req.query.with.waters)
      .populate('subscribers', req.query.with.subscribers)
      .populate({
        path: 'comments.commentBy',
        model: 'User',
        select: req.query.with.commentBy,
      })
      .populate({
        path: 'comments.replies.replyBy',
        model: 'User',
        select: req.query.with.replyBy,
      })
      .sort(req.query.sortBy)
      .skip((req.query.page - 1) * req.query.perPage)
      .limit(req.query.perPage)
      .exec((err, posts) => {
        if (err) {
          return next(err);
        }

        const morePosts = req.query.perPage === posts.length;
        // if (morePosts) {
        //   posts.pop();
        // }
        posts.map((e) => {
          e.afterSave(req.user, req.query.limitComments);
        });
        res.status(httpStatus.OK);
        res.json({
          records: posts,
          morePosts,
        });
      });
  } catch (error) {
    next(error);
  }
};
