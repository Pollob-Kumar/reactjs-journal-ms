const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  getReviewers,
  getEditors,
  getUserStats
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { mongoIdValidation, validate } = require('../utils/validators');
const { ROLES } = require('../config/constants');

// All routes require authentication
router.use(protect);

// Get reviewers list (Editor, Admin only)
router.get('/reviewers', authorize(ROLES.EDITOR, ROLES.ADMIN), getReviewers);

// Get editors list (Admin only)
router.get('/editors', authorize(ROLES.ADMIN), getEditors);

// Get user profile
router.get('/:id', mongoIdValidation.param, validate, getUserProfile);

// Get user statistics
router.get('/:id/stats', mongoIdValidation.param, validate, getUserStats);

module.exports = router;