const path = require('path');
const Events = require('events');
const logger = require(path.resolve('./config/logger'));
const Activity = require(path.resolve('./src/activity/models/activity.model'));

/**
 * Instantiate Event
 */
const PostEvent = new Events.EventEmitter();

/**
 * Save & sent push notificaion
 */
PostEvent.on('create', async (data) => {
  try {
    // check for message
    data.activity = data.message || 'Created new post';
    // save the activity in db
    await (new Activity(data)).save();
  } catch (e) {
    logger.error(e);
  }
});

/**
 * Event based notifications to post user
 */
['water', 'comment', 'unwater'].map((action) => {
  PostEvent.on(action, async (data) => {
    data.post.notifyUsers({
      postId: data.post._id,
      actorId: data.actor._id,
      type: action,
      config: {
        systemLevel: (action === 'unwater'),
        avoidEmail: (action === 'unwater'),
      },
    });
  });
});
