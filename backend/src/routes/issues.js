const express = require('express');
const router = express.Router();
const {
  createIssue,
  getIssues,
  getIssue,
  addManuscriptToIssue,
  removeManuscriptFromIssue,
  publishIssue,
  updateIssue,
  deleteIssue
} = require('../controllers/issueController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { issueValidation, mongoIdValidation, validate } = require('../utils/validators');
const { ROLES } = require('../config/constants');

// Public routes (with optional auth for additional features)
router.get('/', optionalAuth, getIssues);
router.get('/:id', optionalAuth, mongoIdValidation.param, validate, getIssue);

// Protected routes (Editor, Admin only)
router.use(protect);
router.use(authorize(ROLES.EDITOR, ROLES.ADMIN));

// Create issue
router.post('/', issueValidation.create, validate, createIssue);

// Update issue
router.put('/:id', mongoIdValidation.param, validate, updateIssue);

// Add manuscript to issue
router.put(
  '/:id/manuscripts',
  mongoIdValidation.param,
  issueValidation.addManuscript,
  validate,
  addManuscriptToIssue
);

// Remove manuscript from issue
router.delete(
  '/:id/manuscripts/:manuscriptId',
  removeManuscriptFromIssue
);

// Publish issue
router.put('/:id/publish', mongoIdValidation.param, validate, publishIssue);

// Delete issue (Admin only)
router.delete(
  '/:id',
  authorize(ROLES.ADMIN),
  mongoIdValidation.param,
  validate,
  deleteIssue
);

module.exports = router;