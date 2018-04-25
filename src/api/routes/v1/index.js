const path = require('path');
const express = require('express');

const userRoutes = require(path.resolve('./src/user/routes/user.route'));
const authRoutes = require(path.resolve('./src/auth/routes/auth.route'));
const postRoutes = require(path.resolve('./src/post/routes/post.route'));

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

/**
 * GET v1/docs
 */
router.use('/docs', express.static('docs'));

/**
 * * api/v1/users
 * User Module routes
 */
router.use('/users', userRoutes);

/**
 * * api/v1/auth
 * Auth Module routes
 */
router.use('/auth', authRoutes);

/**
 * * api/v1/posts
 * Post Module routes
 */
router.use('/posts', postRoutes);

module.exports = router;
