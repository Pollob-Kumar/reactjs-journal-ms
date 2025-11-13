const User = require('../models/User');
const Manuscript = require('../models/Manuscript');
const Review = require('../models/Review');
const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const { ROLES } = require('../config/constants');
// backend/src/controllers/adminController.js - Add DOI management methods

const Manuscript = require('../models/Manuscript');
const { assignDOI } = require('../services/doiService');
const { MANUSCRIPT_STATUS } = require('../config/constants');

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

// backend/src/controllers/adminController.js - Add these methods

// @desc    Get manuscript revision history
// @route   GET /api/admin/manuscripts/:id/revisions
// @access  Private (Admin)
exports.getManuscriptRevisions = async (req, res, next) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id)
      .populate('submittedBy', 'firstName lastName email')
      .populate('revisions.submittedBy', 'firstName lastName email')
      .populate('assignedEditor', 'firstName lastName email');

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    // Build comprehensive revision history
    const revisionHistory = [
      {
        version: 1,
        submittedAt: manuscript.submissionDate,
        submittedBy: manuscript.submittedBy,
        files: manuscript.files,
        status: 'Initial Submission',
        isInitial: true
      },
      ...manuscript.revisions.map(revision => ({
        version: revision.version,
        submittedAt: revision.submittedAt,
        submittedBy: revision.submittedBy,
        files: revision.files,
        responseToReviewers: revision.responseToReviewers,
        status: 'Revision',
        isInitial: false
      }))
    ];

    res.status(200).json({
      success: true,
      data: {
        manuscriptId: manuscript.manuscriptId,
        title: manuscript.title,
        currentVersion: manuscript.currentVersion,
        revisionHistory,
        timeline: manuscript.timeline
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific revision files
// @route   GET /api/admin/manuscripts/:id/revisions/:version
// @access  Private (Admin)
exports.getRevisionDetails = async (req, res, next) => {
  try {
    const { id, version } = req.params;
    const manuscript = await Manuscript.findById(id)
      .populate('submittedBy', 'firstName lastName email affiliation')
      .populate('revisions.submittedBy', 'firstName lastName email');

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    let revisionData;
    const versionNum = parseInt(version);

    if (versionNum === 1) {
      // Initial submission
      revisionData = {
        version: 1,
        submittedAt: manuscript.submissionDate,
        submittedBy: manuscript.submittedBy,
        files: manuscript.files,
        title: manuscript.title,
        abstract: manuscript.abstract,
        keywords: manuscript.keywords,
        authors: manuscript.authors,
        isInitial: true
      };
    } else {
      // Find specific revision
      const revision = manuscript.revisions.find(r => r.version === versionNum);
      if (!revision) {
        return res.status(404).json({
          success: false,
          message: 'Revision not found'
        });
      }

      revisionData = {
        version: revision.version,
        submittedAt: revision.submittedAt,
        submittedBy: revision.submittedBy,
        files: revision.files,
        responseToReviewers: revision.responseToReviewers,
        isInitial: false
      };
    }

    res.status(200).json({
      success: true,
      data: revisionData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Compare two revisions
// @route   GET /api/admin/manuscripts/:id/revisions/compare/:version1/:version2
// @access  Private (Admin)
exports.compareRevisions = async (req, res, next) => {
  try {
    const { id, version1, version2 } = req.params;
    const manuscript = await Manuscript.findById(id)
      .populate('submittedBy', 'firstName lastName email')
      .populate('revisions.submittedBy', 'firstName lastName email');

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    const v1 = parseInt(version1);
    const v2 = parseInt(version2);

    // Get revision data
    const getRevisionData = (versionNum) => {
      if (versionNum === 1) {
        return {
          version: 1,
          submittedAt: manuscript.submissionDate,
          submittedBy: manuscript.submittedBy,
          files: manuscript.files
        };
      }
      return manuscript.revisions.find(r => r.version === versionNum);
    };

    const revision1 = getRevisionData(v1);
    const revision2 = getRevisionData(v2);

    if (!revision1 || !revision2) {
      return res.status(404).json({
        success: false,
        message: 'One or both revisions not found'
      });
    }

    // Compare files
    const filesAdded = revision2.files.filter(
      f2 => !revision1.files.some(f1 => f1.originalName === f2.originalName)
    );

    const filesRemoved = revision1.files.filter(
      f1 => !revision2.files.some(f2 => f2.originalName === f1.originalName)
    );

    const filesModified = revision2.files.filter(f2 => {
      const f1 = revision1.files.find(f => f.originalName === f2.originalName);
      return f1 && (f1.size !== f2.size || f1.uploadDate !== f2.uploadDate);
    });

    res.status(200).json({
      success: true,
      data: {
        manuscriptId: manuscript.manuscriptId,
        title: manuscript.title,
        comparison: {
          version1: {
            version: revision1.version,
            submittedAt: revision1.submittedAt || revision1.submissionDate,
            submittedBy: revision1.submittedBy,
            fileCount: revision1.files.length
          },
          version2: {
            version: revision2.version,
            submittedAt: revision2.submittedAt,
            submittedBy: revision2.submittedBy,
            fileCount: revision2.files.length
          },
          changes: {
            filesAdded,
            filesRemoved,
            filesModified,
            summary: {
              added: filesAdded.length,
              removed: filesRemoved.length,
              modified: filesModified.length
            }
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all manuscripts with DOI deposit status
// @route   GET /api/admin/doi/deposits
// @access  Private (Admin)
exports.getDoiDeposits = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = {
      status: MANUSCRIPT_STATUS.PUBLISHED
    };

    // Filter by deposit status
    if (status && status !== 'all') {
      query['doiMetadata.depositStatus'] = status;
    }

    const manuscripts = await Manuscript.find(query)
      .select('manuscriptId title doi doiMetadata publishedDate publicUrl status')
      .populate('submittedBy', 'firstName lastName email')
      .sort({ 'doiMetadata.lastDepositAttempt': -1, publishedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Manuscript.countDocuments(query);

    // Calculate statistics
    const stats = await Manuscript.aggregate([
      { $match: { status: MANUSCRIPT_STATUS.PUBLISHED } },
      {
        $group: {
          _id: '$doiMetadata.depositStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const statistics = {
      total: 0,
      not_assigned: 0,
      pending: 0,
      processing: 0,
      success: 0,
      failed: 0
    };

    stats.forEach(stat => {
      statistics[stat._id] = stat.count;
      statistics.total += stat.count;
    });

    res.status(200).json({
      success: true,
      data: {
        manuscripts,
        statistics,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get DOI deposit details for a manuscript
// @route   GET /api/admin/doi/deposits/:id
// @access  Private (Admin)
exports.getDoiDepositDetails = async (req, res, next) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id)
      .populate('submittedBy', 'firstName lastName email affiliation')
      .populate('assignedEditor', 'firstName lastName email');

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        manuscriptId: manuscript.manuscriptId,
        title: manuscript.title,
        doi: manuscript.doi,
        publicUrl: manuscript.publicUrl,
        publishedDate: manuscript.publishedDate,
        status: manuscript.status,
        doiMetadata: manuscript.doiMetadata,
        authors: manuscript.authors,
        submittedBy: manuscript.submittedBy,
        assignedEditor: manuscript.assignedEditor
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retry DOI deposit for a manuscript
// @route   POST /api/admin/doi/deposits/:id/retry
// @access  Private (Admin)
exports.retryDoiDeposit = async (req, res, next) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id)
      .populate('submittedBy', 'email');

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    if (manuscript.status !== MANUSCRIPT_STATUS.PUBLISHED) {
      return res.status(400).json({
        success: false,
        message: 'Only published manuscripts can have DOI assigned'
      });
    }

    // Update deposit status to processing
    manuscript.doiMetadata.depositStatus = 'processing';
    await manuscript.save();

    // Attempt DOI assignment
    try {
      const correspondingAuthor = manuscript.authors.find(a => a.isCorresponding);
      const authorEmail = correspondingAuthor ? correspondingAuthor.email : manuscript.authors[0].email;

      const doiData = {
        title: manuscript.title,
        authors: manuscript.authors.map(a => ({
          given: a.firstName,
          family: a.lastName,
          affiliation: [{ name: a.affiliation }],
          ORCID: a.orcid || undefined
        })),
        publishedDate: manuscript.publishedDate || new Date(),
        abstract: manuscript.abstract,
        url: manuscript.publicUrl || `${process.env.CLIENT_URL}/articles/${manuscript.manuscriptId}`,
        email: authorEmail
      };

      const doi = await assignDOI(doiData);

      // Record successful deposit
      manuscript.recordDoiDeposit('success', { doi, timestamp: new Date() });
      manuscript.doi = doi;
      
      // Generate and save public URL
      manuscript.generatePublicUrl();
      
      await manuscript.save();

      // Add timeline event
      manuscript.addTimelineEvent(
        'DOI Assigned',
        req.user.id,
        `DOI ${doi} successfully assigned (retry by admin)`
      );
      await manuscript.save();

      res.status(200).json({
        success: true,
        message: 'DOI deposit successful',
        data: {
          doi,
          publicUrl: manuscript.publicUrl,
          depositStatus: manuscript.doiMetadata.depositStatus
        }
      });
    } catch (doiError) {
      // Record failed deposit
      manuscript.recordDoiDeposit('failed', null, doiError.message);
      await manuscript.save();

      return res.status(500).json({
        success: false,
        message: 'DOI deposit failed',
        error: doiError.message
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Manually assign DOI to a manuscript
// @route   POST /api/admin/doi/deposits/:id/assign
// @access  Private (Admin)
exports.manuallyAssignDoi = async (req, res, next) => {
  try {
    const { doi } = req.body;

    if (!doi) {
      return res.status(400).json({
        success: false,
        message: 'DOI is required'
      });
    }

    // Validate DOI format
    const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
    if (!doiRegex.test(doi)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid DOI format'
      });
    }

    const manuscript = await Manuscript.findById(req.params.id);

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    // Check if DOI already exists
    const existingDoi = await Manuscript.findOne({ doi });
    if (existingDoi && existingDoi._id.toString() !== manuscript._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'This DOI is already assigned to another manuscript'
      });
    }

    // Manually assign DOI
    manuscript.doi = doi;
    manuscript.doiMetadata.depositStatus = 'success';
    manuscript.doiMetadata.depositAttempts += 1;
    manuscript.doiMetadata.lastDepositAttempt = new Date();
    
    manuscript.doiMetadata.depositHistory.push({
      attemptNumber: manuscript.doiMetadata.depositAttempts,
      timestamp: new Date(),
      status: 'success',
      error: null,
      response: { doi, manual: true, assignedBy: req.user.id }
    });

    // Generate public URL
    manuscript.generatePublicUrl();

    await manuscript.save();

    // Add timeline event
    manuscript.addTimelineEvent(
      'DOI Manually Assigned',
      req.user.id,
      `DOI ${doi} manually assigned by admin`
    );
    await manuscript.save();

    res.status(200).json({
      success: true,
      message: 'DOI manually assigned successfully',
      data: {
        doi,
        publicUrl: manuscript.publicUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk retry failed DOI deposits
// @route   POST /api/admin/doi/deposits/bulk-retry
// @access  Private (Admin)
exports.bulkRetryDoiDeposits = async (req, res, next) => {
  try {
    const failedManuscripts = await Manuscript.find({
      status: MANUSCRIPT_STATUS.PUBLISHED,
      'doiMetadata.depositStatus': 'failed'
    }).limit(50); // Process 50 at a time

    const results = {
      total: failedManuscripts.length,
      success: 0,
      failed: 0,
      details: []
    };

    for (const manuscript of failedManuscripts) {
      try {
        const correspondingAuthor = manuscript.authors.find(a => a.isCorresponding);
        const authorEmail = correspondingAuthor ? correspondingAuthor.email : manuscript.authors[0].email;

        const doiData = {
          title: manuscript.title,
          authors: manuscript.authors.map(a => ({
            given: a.firstName,
            family: a.lastName,
            affiliation: [{ name: a.affiliation }],
            ORCID: a.orcid || undefined
          })),
          publishedDate: manuscript.publishedDate || new Date(),
          abstract: manuscript.abstract,
          url: manuscript.publicUrl || `${process.env.CLIENT_URL}/articles/${manuscript.manuscriptId}`,
          email: authorEmail
        };

        const doi = await assignDOI(doiData);
        manuscript.recordDoiDeposit('success', { doi, timestamp: new Date() });
        manuscript.doi = doi;
        manuscript.generatePublicUrl();
        await manuscript.save();

        results.success++;
        results.details.push({
          manuscriptId: manuscript.manuscriptId,
          status: 'success',
          doi
        });
      } catch (error) {
        manuscript.recordDoiDeposit('failed', null, error.message);
        await manuscript.save();

        results.failed++;
        results.details.push({
          manuscriptId: manuscript.manuscriptId,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk retry completed: ${results.success} succeeded, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};
