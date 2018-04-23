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
 * Module routes
 */
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/post', postRoutes);

module.exports = router;
