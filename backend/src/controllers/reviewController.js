const Review = require('../models/Review');
const Manuscript = require('../models/Manuscript');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { REVIEW_STATUS, ROLES, NOTIFICATION_TYPES } = require('../config/constants');
const { sendEmail } = require('../services/emailService');

// @desc    Assign reviewers to manuscript
// @route   POST /api/manuscripts/:manuscriptId/reviews
// @access  Private (Editor, Admin)
exports.assignReviewers = async (req, res, next) => {
  try {
    const { reviewerIds } = req.body;
    const { manuscriptId } = req.params;

    if (!reviewerIds || reviewerIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 reviewers must be assigned'
      });
    }

    const manuscript = await Manuscript.findById(manuscriptId);
    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    // Verify all reviewers exist and have reviewer role
    const reviewers = await User.find({
      _id: { $in: reviewerIds },
      roles: ROLES.REVIEWER,
      isActive: true
    });

    if (reviewers.length !== reviewerIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more invalid reviewer IDs'
      });
    }

    const createdReviews = [];

    for (const reviewer of reviewers) {
      // Check if reviewer already assigned
      const existingReview = await Review.findOne({
        manuscript: manuscriptId,
        reviewer: reviewer._id
      });

      if (existingReview) {
        continue;
      }

      // Create review
      const review = await Review.create({
        manuscript: manuscriptId,
        reviewer: reviewer._id,
        assignedBy: req.user.id,
        status: REVIEW_STATUS.INVITATION_SENT
      });

      createdReviews.push(review);

      // Add to manuscript's reviews array
      manuscript.reviews.push(review._id);

      // Create notification
      await Notification.create({
        recipient: reviewer._id,
        type: NOTIFICATION_TYPES.REVIEW_INVITATION,
        subject: 'Review Invitation',
        message: `You have been invited to review manuscript "${manuscript.title}" (${manuscript.manuscriptId}).`,
        relatedManuscript: manuscriptId,
        relatedReview: review._id
      });

      // Send invitation email
      await sendEmail({
        to: reviewer.email,
        subject: `Review Invitation: ${manuscript.manuscriptId}`,
        template: 'review-invitation',
        data: {
          reviewerName: reviewer.fullName,
          manuscriptId: manuscript.manuscriptId,
          title: manuscript.title,
          dueDate: review.dueDate,
          acceptUrl: `${process.env.CLIENT_URL}/reviews/${review._id}/accept`,
          declineUrl: `${process.env.CLIENT_URL}/reviews/${review._id}/decline`
        }
      });
    }

    // Update manuscript timeline
    manuscript.addTimelineEvent(
      'Reviewers Assigned',
      req.user.id,
      `${createdReviews.length} reviewer(s) assigned`
    );

    await manuscript.save();

    res.status(201).json({
      success: true,
      message: `${createdReviews.length} reviewer(s) assigned successfully`,
      data: createdReviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a manuscript
// @route   GET /api/manuscripts/:manuscriptId/reviews
// @access  Private (Editor, Admin, Assigned Editor)
exports.getManuscriptReviews = async (req, res, next) => {
  try {
    const { manuscriptId } = req.params;

    const manuscript = await Manuscript.findById(manuscriptId);
    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    const reviews = await Review.find({ manuscript: manuscriptId })
      .populate('reviewer', 'firstName lastName email affiliation expertise')
      .populate('assignedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews assigned to current user
// @route   GET /api/reviews/my-reviews
// @access  Private (Reviewer)
exports.getMyReviews = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = { reviewer: req.user.id };
    
    if (status) {
      query.status = status;
    }

    const reviews = await Review.find(query)
      .populate('manuscript', 'manuscriptId title abstract keywords submissionDate')
      .populate('assignedBy', 'firstName lastName email')
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Private (Reviewer, Editor, Admin)
exports.getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('manuscript')
      .populate('reviewer', 'firstName lastName email affiliation expertise')
      .populate('assignedBy', 'firstName lastName email');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Authorization check
    const isReviewer = review.reviewer._id.toString() === req.user.id.toString();
    const isEditor = req.user.roles.includes(ROLES.EDITOR);
    const isAdmin = req.user.roles.includes(ROLES.ADMIN);

    if (!isReviewer && !isEditor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this review'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept review invitation
// @route   PUT /api/reviews/:id/accept
// @access  Private (Reviewer)
exports.acceptInvitation = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id).populate('manuscript');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Verify user is the assigned reviewer
    if (review.reviewer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this invitation'
      });
    }

    if (review.invitationResponse.responded) {
      return res.status(400).json({
        success: false,
        message: 'You have already responded to this invitation'
      });
    }

    review.acceptInvitation();
    await review.save();

    // Notify editor
    const manuscript = await Manuscript.findById(review.manuscript._id);
    if (manuscript.assignedEditor) {
      await Notification.create({
        recipient: manuscript.assignedEditor,
        type: NOTIFICATION_TYPES.REVIEW_INVITATION,
        subject: 'Review Invitation Accepted',
        message: `${req.user.fullName} has accepted the review invitation for manuscript "${manuscript.title}" (${manuscript.manuscriptId}).`,
        relatedManuscript: manuscript._id,
        relatedReview: review._id
      });

      const editor = await User.findById(manuscript.assignedEditor);
      await sendEmail({
        to: editor.email,
        subject: 'Review Invitation Accepted',
        template: 'review-accepted',
        data: {
          editorName: editor.fullName,
          reviewerName: req.user.fullName,
          manuscriptId: manuscript.manuscriptId,
          title: manuscript.title
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review invitation accepted',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Decline review invitation
// @route   PUT /api/reviews/:id/decline
// @access  Private (Reviewer)
exports.declineInvitation = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const review = await Review.findById(req.params.id).populate('manuscript');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Verify user is the assigned reviewer
    if (review.reviewer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this invitation'
      });
    }

    if (review.invitationResponse.responded) {
      return res.status(400).json({
        success: false,
        message: 'You have already responded to this invitation'
      });
    }

    review.declineInvitation(reason);
    await review.save();

    // Notify editor
    const manuscript = await Manuscript.findById(review.manuscript._id);
    if (manuscript.assignedEditor) {
      await Notification.create({
        recipient: manuscript.assignedEditor,
        type: NOTIFICATION_TYPES.REVIEW_INVITATION,
        subject: 'Review Invitation Declined',
        message: `${req.user.fullName} has declined the review invitation for manuscript "${manuscript.title}" (${manuscript.manuscriptId}).`,
        relatedManuscript: manuscript._id,
        relatedReview: review._id
      });

      const editor = await User.findById(manuscript.assignedEditor);
      await sendEmail({
        to: editor.email,
        subject: 'Review Invitation Declined',
        template: 'review-declined',
        data: {
          editorName: editor.fullName,
          reviewerName: req.user.fullName,
          manuscriptId: manuscript.manuscriptId,
          title: manuscript.title,
          reason: reason || 'No reason provided'
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review invitation declined',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit review
// @route   PUT /api/reviews/:id/submit
// @access  Private (Reviewer)
exports.submitReview = async (req, res, next) => {
  try {
    const { confidentialComments, authorComments, recommendation } = req.body;

    if (!confidentialComments || !authorComments || !recommendation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const review = await Review.findById(req.params.id).populate('manuscript');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Verify user is the assigned reviewer
    if (review.reviewer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this review'
      });
    }

    if (review.status === REVIEW_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'This review has already been submitted'
      });
    }

    if (review.status !== REVIEW_STATUS.IN_PROGRESS) {
      return res.status(400).json({
        success: false,
        message: 'Review invitation must be accepted before submitting'
      });
    }

    review.submitReview(confidentialComments, authorComments, recommendation);
    await review.save();

    // Update manuscript timeline
    const manuscript = await Manuscript.findById(review.manuscript._id);
    manuscript.addTimelineEvent(
      'Review Completed',
      req.user.id,
      `Review submitted with recommendation: ${recommendation}`
    );
    await manuscript.save();

    // Notify editor
    if (manuscript.assignedEditor) {
      await Notification.create({
        recipient: manuscript.assignedEditor,
        type: NOTIFICATION_TYPES.REVIEW_COMPLETED,
        subject: 'Review Completed',
        message: `A review has been submitted for manuscript "${manuscript.title}" (${manuscript.manuscriptId}).`,
        relatedManuscript: manuscript._id,
        relatedReview: review._id
      });

      const editor = await User.findById(manuscript.assignedEditor);
      await sendEmail({
        to: editor.email,
        subject: 'Review Completed',
        template: 'review-completed',
        data: {
          editorName: editor.fullName,
          manuscriptId: manuscript.manuscriptId,
          title: manuscript.title,
          recommendation: recommendation
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send review reminder
// @route   POST /api/reviews/:id/remind
// @access  Private (Editor, Admin)
exports.sendReminder = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('manuscript')
      .populate('reviewer', 'firstName lastName email');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.status === REVIEW_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Review already completed'
      });
    }

    // Add reminder timestamp
    review.remindersSent.push(new Date());
    review.lastReminderDate = new Date();
    await review.save();

    // Send reminder email
    await sendEmail({
      to: review.reviewer.email,
      subject: `Reminder: Review Due for ${review.manuscript.manuscriptId}`,
      template: 'review-reminder',
      data: {
        reviewerName: review.reviewer.fullName,
        manuscriptId: review.manuscript.manuscriptId,
        title: review.manuscript.title,
        dueDate: review.dueDate
      }
    });

    res.status(200).json({
      success: true,
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    next(error);
  }
};