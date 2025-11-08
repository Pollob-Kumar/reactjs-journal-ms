const express = require('express');
const router = express.Router();
const {
  assignReviewers,
  getManuscriptReviews,
  getMyReviews,
  getReview,
  acceptInvitation,
  declineInvitation,
  submitReview,
  sendReminder
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { reviewValidation, mongoIdValidation, validate } = require('../utils/validators');
const { ROLES } = require('../config/constants');

// All routes require authentication
router.use(protect);

// Get my reviews (Reviewer only)
router.get('/my-reviews', authorize(ROLES.REVIEWER), getMyReviews);

// Get single review
router.get('/:id', mongoIdValidation.param, validate, getReview);

// Accept review invitation (Reviewer only)
router.put(
  '/:id/accept',
  authorize(ROLES.REVIEWER),
  mongoIdValidation.param,
  validate,
  acceptInvitation
);

// Decline review invitation (Reviewer only)
router.put(
  '/:id/decline',
  authorize(ROLES.REVIEWER),
  mongoIdValidation.param,
  reviewValidation.decline,
  validate,
  declineInvitation
);

// Submit review (Reviewer only)
router.put(
  '/:id/submit',
  authorize(ROLES.REVIEWER),
  mongoIdValidation.param,
  reviewValidation.submit,
  validate,
  submitReview
);

// Send reminder (Editor, Admin only)
router.post(
  '/:id/remind',
  authorize(ROLES.EDITOR, ROLES.ADMIN),
  mongoIdValidation.param,
  validate,
  sendReminder
);

// Assign reviewers to manuscript (Editor, Admin only)
router.post(
  '/manuscripts/:manuscriptId/assign',
  authorize(ROLES.EDITOR, ROLES.ADMIN),
  reviewValidation.assign,
  validate,
  assignReviewers
);

// Get all reviews for a manuscript (Editor, Admin only)
router.get(
  '/manuscripts/:manuscriptId',
  authorize(ROLES.EDITOR, ROLES.ADMIN),
  getManuscriptReviews
);

module.exports = router;