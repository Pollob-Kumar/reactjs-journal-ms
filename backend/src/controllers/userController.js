const User = require('../models/User');
const Manuscript = require('../models/Manuscript');
const Review = require('../models/Review');
const { ROLES } = require('../config/constants');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Public profile information
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        affiliation: user.affiliation,
        expertise: user.expertise,
        orcid: user.orcid,
        bio: user.bio,
        roles: user.roles
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviewers
// @route   GET /api/users/reviewers
// @access  Private (Editor, Admin)
exports.getReviewers = async (req, res, next) => {
  try {
    const { expertise, search } = req.query;

    let query = {
      roles: ROLES.REVIEWER,
      isActive: true
    };

    // Filter by expertise
    if (expertise) {
      query.expertise = { $in: [expertise] };
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const reviewers = await User.find(query)
      .select('firstName lastName email affiliation expertise orcid')
      .sort({ lastName: 1 });

    res.status(200).json({
      success: true,
      data: reviewers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all editors
// @route   GET /api/users/editors
// @access  Private (Admin)
exports.getEditors = async (req, res, next) => {
  try {
    const editors = await User.find({
      roles: ROLES.EDITOR,
      isActive: true
    })
      .select('firstName lastName email affiliation')
      .sort({ lastName: 1 });

    res.status(200).json({
      success: true,
      data: editors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Private
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Check if user is requesting their own stats or is admin
    if (userId !== req.user.id && !req.user.roles.includes(ROLES.ADMIN)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these statistics'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const stats = {
      author: {},
      reviewer: {},
      editor: {}
    };

    // Author stats
    if (user.roles.includes(ROLES.AUTHOR)) {
      const totalSubmissions = await Manuscript.countDocuments({ submittedBy: userId });
      const acceptedPapers = await Manuscript.countDocuments({ 
        submittedBy: userId, 
        status: 'Accepted' 
      });
      const publishedPapers = await Manuscript.countDocuments({ 
        submittedBy: userId, 
        status: 'Published' 
      });
      const rejectedPapers = await Manuscript.countDocuments({ 
        submittedBy: userId, 
        status: 'Rejected' 
      });

      stats.author = {
        totalSubmissions,
        acceptedPapers,
        publishedPapers,
        rejectedPapers,
        acceptanceRate: totalSubmissions > 0 
          ? ((acceptedPapers / totalSubmissions) * 100).toFixed(2) + '%' 
          : '0%'
      };
    }

    // Reviewer stats
    if (user.roles.includes(ROLES.REVIEWER)) {
      const totalInvitations = await Review.countDocuments({ reviewer: userId });
      const acceptedInvitations = await Review.countDocuments({ 
        reviewer: userId, 
        'invitationResponse.accepted': true 
      });
      const completedReviews = await Review.countDocuments({ 
        reviewer: userId, 
        status: 'Completed' 
      });
      const pendingReviews = await Review.countDocuments({ 
        reviewer: userId, 
        status: 'In Progress' 
      });

      stats.reviewer = {
        totalInvitations,
        acceptedInvitations,
        completedReviews,
        pendingReviews,
        acceptanceRate: totalInvitations > 0 
          ? ((acceptedInvitations / totalInvitations) * 100).toFixed(2) + '%' 
          : '0%'
      };
    }

    // Editor stats
    if (user.roles.includes(ROLES.EDITOR)) {
      const assignedManuscripts = await Manuscript.countDocuments({ assignedEditor: userId });
      const decisionsAccept = await Manuscript.countDocuments({ 
        assignedEditor: userId,
        'editorDecision.decision': 'Accept'
      });
      const decisionsReject = await Manuscript.countDocuments({ 
        assignedEditor: userId,
        'editorDecision.decision': 'Reject'
      });

      stats.editor = {
        assignedManuscripts,
        decisionsAccept,
        decisionsReject
      };
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};