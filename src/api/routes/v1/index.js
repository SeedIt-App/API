const path = require('path');
const express = require('express');
const authRoutes = require(path.resolve('./src/auth/routes/auth.route'));
const userRoutes = require(path.resolve('./src/user/routes/user.route'));
const postRoutes = require(path.resolve('./src/post/routes/post.route'));
const tagRoutes = require(path.resolve('./src/tag/routes/tag.route'));

const router = express.Router();

/**
 * GET api/v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

/**
 * GET api/v1/docs
 */
router.use('/docs', express.static('docs'));

/**
 * REST api/v1/auth
 */
router.use('/auth', authRoutes);

/**
 * REST api/v1/users
 */
router.use('/users', userRoutes);

/**
 * REST api/v1/posts
 */
router.use('/posts', postRoutes);

/**
 * REST api/v1/tags
 */
router.use('/tags', tagRoutes);

module.exports = router;
