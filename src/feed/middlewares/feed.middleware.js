/**
 * Query filter middleware to recheck values
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
exports.query = (req, res, next) => {
  // check & set the page
  req.query.page = (req.query.page) ? parseInt(req.query.page, 10) : 1;
  // check & set the perpage query
  req.query.perPage = (req.query.perPage) ? parseInt(req.query.perPage, 10) : 10;
  // check order by is set
  req.query.order = (req.query.order) ? req.query.order : 'createdAt';
  // check sort set in query
  req.query.sort = (req.query.sort) ? req.query.sort : 'desc';
  // check & set select fields with no secret fields
  if (req.query.select) {
    // convert comma to space
    req.query.select = (req.query.select === '*') ? '' : req.query.select.split(',').join(' ');
  }
  // sortBy
  req.query.sortBy = {};
  // set sort by values
  req.query.sortBy[req.query.order] = req.query.sort;
  // check filter is defined in the feed query
  req.query.filter = (req.query.filter) ? req.query.filter : {};
  // add default values to the query filter - deleteFlag
  req.query.filter.deleteFlag = false;
  // check limitComment is set
  req.query.limitComments = (req.query.limitComments) ? req.query.limitComments : 10;

  // model populate with other objects
  req.query.with = (req.query.with) ? req.query.with : {};

  req.query.with.tag = (req.query.with.tag) ? req.query.with.tag.split(',').join(' ') : 'tag';
  req.query.with.waters = (req.query.with.waters) ? req.query.with.waters.split(',').join(' ') : 'firstName lastName userName email';
  req.query.with.postedBy = (req.query.with.postedBy) ? req.query.with.postedBy.split(',').join(' ') : 'firstName lastName userName email';
  req.query.with.commentBy = (req.query.with.commentBy) ? req.query.with.commentBy.split(',').join(' ') : 'firstName lastName userName email';
  req.query.with.replyBy = (req.query.with.replyBy) ? req.query.with.replyBy.split(',').join(' ') : 'firstName lastName userName email';
  req.query.with.subscribers = (req.query.with.subscribers) ? req.query.with.subscribers.split(',').join(' ') : 'firstName lastName userName email';

  return next();
};
