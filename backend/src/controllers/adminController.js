const User = require('../models/User');
const Manuscript = require('../models/Manuscript');
const Review = require('../models/Review');
const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const { ROLES } = require('../config/constants');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;

    let query = {};

    if (role) {
      query.roles = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create user
// @route   POST /api/admin/users
// @access  Private (Admin)
exports.createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, affiliation, roles, expertise, orcid } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      affiliation,
      roles: roles || [ROLES.AUTHOR],
      expertise,
      orcid
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res, next) => {
  try {
    const { roles, isActive, expertise } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (roles) user.roles = roles;
    if (isActive !== undefined) user.isActive = isActive;
    if (expertise) user.expertise = expertise;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting self
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Check if user has active manuscripts or reviews
    const hasManuscripts = await Manuscript.countDocuments({ submittedBy: user._id });
    const hasReviews = await Review.countDocuments({ reviewer: user._id });

    if (hasManuscripts > 0 || hasReviews > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active manuscripts or reviews. Consider deactivating instead.'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/statistics
// @access  Private (Admin)
exports.getSystemStatistics = async (req, res, next) => {
  try {
    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const usersByRole = await User.aggregate([
      { $unwind: '$roles' },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Manuscript statistics
    const totalManuscripts = await Manuscript.countDocuments();
    const manuscriptsByStatus = await Manuscript.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const acceptedCount = await Manuscript.countDocuments({ status: 'Accepted' });
    const rejectedCount = await Manuscript.countDocuments({ status: 'Rejected' });
    const acceptanceRate = totalManuscripts > 0 
      ? ((acceptedCount / totalManuscripts) * 100).toFixed(2) 
      : 0;

    // Review statistics
    const totalReviews = await Review.countDocuments();
    const completedReviews = await Review.countDocuments({ status: 'Completed' });
    const pendingReviews = await Review.countDocuments({ status: 'In Progress' });

    // Publication statistics
    const totalIssues = await Issue.countDocuments();
    const publishedIssues = await Issue.countDocuments({ isPublished: true });
    const publishedPapers = await Manuscript.countDocuments({ status: 'Published' });

    // Time-based statistics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSubmissions = await Manuscript.countDocuments({
      submissionDate: { $gte: thirtyDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          byRole: usersByRole
        },
        manuscripts: {
          total: totalManuscripts,
          byStatus: manuscriptsByStatus,
          acceptanceRate: `${acceptanceRate}%`,
          recentSubmissions
        },
        reviews: {
          total: totalReviews,
          completed: completedReviews,
          pending: pendingReviews
        },
        publications: {
          totalIssues,
          publishedIssues,
          publishedPapers
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all manuscripts (admin view)
// @route   GET /api/admin/manuscripts
// @access  Private (Admin)
exports.getAllManuscripts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }

    const manuscripts = await Manuscript.find(query)
      .populate('submittedBy', 'firstName lastName email')
      .populate('assignedEditor', 'firstName lastName email')
      .sort({ submissionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Manuscript.countDocuments(query);

    res.status(200).json({
      success: true,
      data: manuscripts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete manuscript (admin)
// @route   DELETE /api/admin/manuscripts/:id
// @access  Private (Admin)
exports.deleteManuscriptAdmin = async (req, res, next) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    // Delete associated reviews
    await Review.deleteMany({ manuscript: manuscript._id });

    // Delete manuscript
    await manuscript.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Manuscript and associated reviews deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};