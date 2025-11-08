const express = require('express');
const router = express.Router();
const {
  submitManuscript,
  getManuscripts,
  getManuscript,
  submitRevision,
  assignEditor,
  makeDecision,
  deleteManuscript,
  getStatistics
} = require('../controllers/manuscriptController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { uploadMultipleFiles } = require('../middleware/upload');
const { manuscriptValidation, mongoIdValidation, validate } = require('../utils/validators');
const { ROLES } = require('../config/constants');

// All routes require authentication
router.use(protect);

// Statistics (Editor, Admin only)
router.get('/stats', authorize(ROLES.EDITOR, ROLES.ADMIN), getStatistics);

// Get all manuscripts (filtered by role)
router.get('/', getManuscripts);

// Submit new manuscript (Author, Reviewer, Editor can submit)
router.post(
  '/',
  uploadMultipleFiles('files', 10),
  manuscriptValidation.submit,
  validate,
  submitManuscript
);

// Get single manuscript
router.get('/:id', mongoIdValidation.param, validate, getManuscript);

// Submit revision (Author only)
router.put(
  '/:id/revise',
  authorize(ROLES.AUTHOR),
  uploadMultipleFiles('files', 10),
  mongoIdValidation.param,
  validate,
  submitRevision
);

// Assign editor (Editor, Admin only)
router.put(
  '/:id/assign-editor',
  authorize(ROLES.EDITOR, ROLES.ADMIN),
  mongoIdValidation.param,
  manuscriptValidation.assignEditor,
  validate,
  assignEditor
);

// Make editorial decision (Editor, Admin only)
router.put(
  '/:id/decision',
  authorize(ROLES.EDITOR, ROLES.ADMIN),
  mongoIdValidation.param,
  manuscriptValidation.makeDecision,
  validate,
  makeDecision
);

// Delete manuscript (Author of manuscript, Admin only)
router.delete(
  '/:id',
  mongoIdValidation.param,
  validate,
  deleteManuscript
);

module.exports = router;