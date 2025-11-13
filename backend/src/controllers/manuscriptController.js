const Manuscript = require('../models/Manuscript');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { MANUSCRIPT_STATUS, ROLES, NOTIFICATION_TYPES } = require('../config/constants');
const { sendEmail } = require('../services/emailService');
const { deleteFile } = require('../config/gridfs');

// @desc    Submit new manuscript
// @route   POST /api/manuscripts
// @access  Private (Author)
exports.submitManuscript = async (req, res, next) => {
  try {
    const { title, abstract, keywords, authors } = req.body;

    // Validate required fields
    if (!title || !abstract || !authors) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, abstract, and authors'
      });
    }

    // Validate file upload
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one manuscript file'
      });
    }

    // Parse authors if it's a string (from form-data)
    const parsedAuthors = typeof authors === 'string' ? JSON.parse(authors) : authors;
    const parsedKeywords = typeof keywords === 'string' ? JSON.parse(keywords) : keywords;

    // Process uploaded files
    const files = req.files.map(file => ({
      fileId: file.id,
      filename: file.filename,
      originalName: file.originalname,
      fileType: file.metadata.fileType,
      size: file.size,
      uploadDate: file.uploadDate
    }));

    // Create manuscript
    const manuscript = await Manuscript.create({
      title,
      abstract,
      keywords: parsedKeywords || [],
      authors: parsedAuthors,
      submittedBy: req.user.id,
      files,
      status: MANUSCRIPT_STATUS.SUBMITTED
    });

    // Add timeline event
    manuscript.addTimelineEvent(
      'Manuscript Submitted',
      req.user.id,
      'Initial manuscript submission'
    );
    await manuscript.save();

    // Create notification for submission confirmation
    await Notification.create({
      recipient: req.user.id,
      type: NOTIFICATION_TYPES.SUBMISSION_CONFIRMATION,
      subject: 'Manuscript Submission Confirmed',
      message: `Your manuscript "${title}" (${manuscript.manuscriptId}) has been successfully submitted.`,
      relatedManuscript: manuscript._id
    });

    // Send confirmation email
    await sendEmail({
      to: req.user.email,
      subject: 'Manuscript Submission Confirmed',
      template: 'submission-confirmation',
      data: {
        name: req.user.fullName,
        manuscriptId: manuscript.manuscriptId,
        title: manuscript.title,
        submissionDate: manuscript.submissionDate
      }
    });

    // Notify all editors about new submission
    const editors = await User.find({ roles: ROLES.EDITOR, isActive: true });
    for (const editor of editors) {
      await Notification.create({
        recipient: editor._id,
        type: NOTIFICATION_TYPES.NEW_SUBMISSION,
        subject: 'New Manuscript Submitted',
        message: `A new manuscript "${title}" (${manuscript.manuscriptId}) has been submitted by ${req.user.fullName}.`,
        relatedManuscript: manuscript._id
      });

      await sendEmail({
        to: editor.email,
        subject: 'New Manuscript Submission',
        template: 'new-submission-editor',
        data: {
          editorName: editor.fullName,
          manuscriptId: manuscript.manuscriptId,
          title: manuscript.title,
          authorName: req.user.fullName,
          submissionDate: manuscript.submissionDate
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Manuscript submitted successfully',
      data: manuscript
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all manuscripts (filtered by role)
// @route   GET /api/manuscripts
// @access  Private
exports.getManuscripts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    
    let query = {};

    // Role-based filtering
    if (req.user.roles.includes(ROLES.AUTHOR) && !req.user.roles.includes(ROLES.EDITOR) && !req.user.roles.includes(ROLES.ADMIN)) {
      // Authors see only their submissions
      query.submittedBy = req.user.id;
    } else if (req.user.roles.includes(ROLES.EDITOR)) {
      // Editors see all or assigned manuscripts
      if (req.query.assigned === 'true') {
        query.assignedEditor = req.user.id;
      }
    }
    // Admins see all manuscripts (no additional filter)

    // Status filter
    if (status) {
      query.status = status;
    }

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    const manuscripts = await Manuscript.find(query)
      .populate('submittedBy', 'firstName lastName email affiliation')
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

// @desc    Get single manuscript
// @route   GET /api/manuscripts/:id
// @access  Private
exports.getManuscript = async (req, res, next) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id)
      .populate('submittedBy', 'firstName lastName email affiliation orcid')
      .populate('assignedEditor', 'firstName lastName email')
      .populate({
        path: 'reviews',
        populate: {
          path: 'reviewer',
          select: 'firstName lastName email affiliation'
        }
      })
      .populate('publishedIn')
      .populate('timeline.performedBy', 'firstName lastName');

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    // Authorization check
    const isAuthor = manuscript.submittedBy._id.toString() === req.user.id.toString();
    const isEditor = req.user.roles.includes(ROLES.EDITOR);
    const isAdmin = req.user.roles.includes(ROLES.ADMIN);
    const isAssignedEditor = manuscript.assignedEditor && manuscript.assignedEditor._id.toString() === req.user.id.toString();

    if (!isAuthor && !isEditor && !isAdmin && !isAssignedEditor) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this manuscript'
      });
    }

    res.status(200).json({
      success: true,
      data: manuscript
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update manuscript (for revisions)
// @route   PUT /api/manuscripts/:id/revise
// @access  Private (Author)
exports.submitRevision = async (req, res, next) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    // Check if user is the author
    if (manuscript.submittedBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to revise this manuscript'
      });
    }

    // Check if revision is required
    if (manuscript.status !== MANUSCRIPT_STATUS.REVISIONS_REQUIRED) {
      return res.status(400).json({
        success: false,
        message: 'This manuscript does not require revisions'
      });
    }

    // Validate file uploads
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload revised manuscript files'
      });
    }

    // Process uploaded files
    const files = req.files.map(file => ({
      fileId: file.id,
      filename: file.filename,
      originalName: file.originalname,
      fileType: file.metadata.fileType,
      size: file.size,
      uploadDate: file.uploadDate
    }));

    // Create new revision
    const newVersion = manuscript.currentVersion + 1;
    manuscript.revisions.push({
      version: newVersion,
      files,
      responseToReviewers: req.body.responseFileId || null,
      submittedBy: req.user.id
    });

    manuscript.currentVersion = newVersion;
    manuscript.status = MANUSCRIPT_STATUS.REVISED_SUBMITTED;

    // Add timeline event
    manuscript.addTimelineEvent(
      'Revision Submitted',
      req.user.id,
      `Version ${newVersion} submitted`
    );

    await manuscript.save();

    // Notify editor
    if (manuscript.assignedEditor) {
      await Notification.create({
        recipient: manuscript.assignedEditor,
        type: NOTIFICATION_TYPES.REVISION_REQUEST,
        subject: 'Revised Manuscript Submitted',
        message: `Author has submitted a revision for manuscript "${manuscript.title}" (${manuscript.manuscriptId}).`,
        relatedManuscript: manuscript._id
      });

      const editor = await User.findById(manuscript.assignedEditor);
      await sendEmail({
        to: editor.email,
        subject: 'Revised Manuscript Submitted',
        template: 'revision-submitted',
        data: {
          editorName: editor.fullName,
          manuscriptId: manuscript.manuscriptId,
          title: manuscript.title,
          version: newVersion
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Revision submitted successfully',
      data: manuscript
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign editor to manuscript
// @route   PUT /api/manuscripts/:id/assign-editor
// @access  Private (Editor, Admin)
exports.assignEditor = async (req, res, next) => {
  try {
    const { editorId } = req.body;

    const manuscript = await Manuscript.findById(req.params.id);

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    // Verify editor exists and has editor role
    const editor = await User.findById(editorId);
    if (!editor || !editor.roles.includes(ROLES.EDITOR)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid editor ID'
      });
    }

    manuscript.assignedEditor = editorId;
    manuscript.status = MANUSCRIPT_STATUS.UNDER_REVIEW;

    // Add timeline event
    manuscript.addTimelineEvent(
      'Editor Assigned',
      req.user.id,
      `Manuscript assigned to ${editor.fullName}`
    );

    await manuscript.save();

    // Notify assigned editor
    await Notification.create({
      recipient: editorId,
      type: NOTIFICATION_TYPES.NEW_SUBMISSION,
      subject: 'Manuscript Assigned to You',
      message: `You have been assigned to handle manuscript "${manuscript.title}" (${manuscript.manuscriptId}).`,
      relatedManuscript: manuscript._id
    });

    await sendEmail({
      to: editor.email,
      subject: 'Manuscript Assignment',
      template: 'editor-assignment',
      data: {
        editorName: editor.fullName,
        manuscriptId: manuscript.manuscriptId,
        title: manuscript.title
      }
    });

    res.status(200).json({
      success: true,
      message: 'Editor assigned successfully',
      data: manuscript
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Make editorial decision
// @route   PUT /api/manuscripts/:id/decision
// @access  Private (Editor, Admin)
exports.makeDecision = async (req, res, next) => {
  try {
    const { decision, comments } = req.body;

    const manuscript = await Manuscript.findById(req.params.id).populate('submittedBy');

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    // Check if user is assigned editor or admin
    const isAssignedEditor = manuscript.assignedEditor && manuscript.assignedEditor.toString() === req.user.id.toString();
    const isAdmin = req.user.roles.includes(ROLES.ADMIN);

    if (!isAssignedEditor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to make decision on this manuscript'
      });
    }

    // Update manuscript with decision
    manuscript.editorDecision = {
      decision,
      comments,
      decidedAt: new Date(),
      decidedBy: req.user.id
    };

    // Update status based on decision
    if (decision === 'Accept') {
      manuscript.status = MANUSCRIPT_STATUS.ACCEPTED;
    } else if (decision === 'Reject') {
      manuscript.status = MANUSCRIPT_STATUS.REJECTED;
    } else if (decision === 'Revisions Required') {
      manuscript.status = MANUSCRIPT_STATUS.REVISIONS_REQUIRED;
    }

    // Add timeline event
    manuscript.addTimelineEvent(
      `Decision: ${decision}`,
      req.user.id,
      comments
    );

    await manuscript.save();

    // Notify author
    await Notification.create({
      recipient: manuscript.submittedBy._id,
      type: NOTIFICATION_TYPES.FINAL_DECISION,
      subject: `Editorial Decision: ${decision}`,
      message: `A decision has been made on your manuscript "${manuscript.title}" (${manuscript.manuscriptId}): ${decision}`,
      relatedManuscript: manuscript._id
    });

    await sendEmail({
      to: manuscript.submittedBy.email,
      subject: `Editorial Decision on ${manuscript.manuscriptId}`,
      template: 'editorial-decision',
      data: {
        authorName: manuscript.submittedBy.fullName,
        manuscriptId: manuscript.manuscriptId,
        title: manuscript.title,
        decision,
        comments
      }
    });

    res.status(200).json({
      success: true,
      message: 'Decision recorded successfully',
      data: manuscript
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete manuscript
// @route   DELETE /api/manuscripts/:id
// @access  Private (Author of manuscript, Admin)
exports.deleteManuscript = async (req, res, next) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    // Check authorization
    const isAuthor = manuscript.submittedBy.toString() === req.user.id.toString();
    const isAdmin = req.user.roles.includes(ROLES.ADMIN);

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this manuscript'
      });
    }

    // Don't allow deletion if manuscript is published
    if (manuscript.status === MANUSCRIPT_STATUS.PUBLISHED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete published manuscripts'
      });
    }

    // Delete associated files from GridFS
    for (const file of manuscript.files) {
      try {
        await deleteFile(file.fileId);
      } catch (err) {
        console.error(`Error deleting file ${file.fileId}:`, err);
      }
    }

    // Delete manuscript
    await manuscript.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Manuscript deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get manuscript statistics
// @route   GET /api/manuscripts/stats
// @access  Private (Editor, Admin)
exports.getStatistics = async (req, res, next) => {
  try {
    const totalSubmissions = await Manuscript.countDocuments();
    
    const statusCounts = await Manuscript.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const acceptedCount = await Manuscript.countDocuments({ status: MANUSCRIPT_STATUS.ACCEPTED });
    const rejectedCount = await Manuscript.countDocuments({ status: MANUSCRIPT_STATUS.REJECTED });
    const acceptanceRate = totalSubmissions > 0 ? ((acceptedCount / totalSubmissions) * 100).toFixed(2) : 0;

    // Average time to publication (for published manuscripts)
    const publishedManuscripts = await Manuscript.find({ 
      status: MANUSCRIPT_STATUS.PUBLISHED,
      publishedDate: { $exists: true }
    });

    let avgTimeToPublication = 0;
    if (publishedManuscripts.length > 0) {
      const totalDays = publishedManuscripts.reduce((sum, ms) => {
        const days = Math.ceil((new Date(ms.publishedDate) - new Date(ms.submissionDate)) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgTimeToPublication = Math.round(totalDays / publishedManuscripts.length);
    }

    res.status(200).json({
      success: true,
      data: {
        totalSubmissions,
        statusCounts,
        acceptanceRate: `${acceptanceRate}%`,
        averageTimeToPublication: `${avgTimeToPublication} days`
      }
    });
  } catch (error) {
    next(error);
  }
};

// backend/src/controllers/manuscriptController.js
// Update the submitRevision method to handle revision notes

exports.submitRevision = async (req, res, next) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id);

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    // Check if user is the author
    if (manuscript.submittedBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to revise this manuscript'
      });
    }

    // Check if revision is required
    if (manuscript.status !== MANUSCRIPT_STATUS.REVISIONS_REQUIRED) {
      return res.status(400).json({
        success: false,
        message: 'This manuscript does not require revisions'
      });
    }

    // Validate file uploads
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload revised manuscript files'
      });
    }

    // Process uploaded files
    const files = req.files.map(file => ({
      fileId: file.id,
      filename: file.filename,
      originalName: file.originalname,
      fileType: file.metadata.fileType,
      size: file.size,
      uploadDate: file.uploadDate
    }));

    // Create new revision
    const newVersion = manuscript.currentVersion + 1;
    manuscript.revisions.push({
      version: newVersion,
      files,
      responseToReviewers: req.body.responseFileId || null,
      submittedBy: req.user.id,
      revisionNotes: req.body.revisionNotes || '' // Add revision notes
    });

    manuscript.currentVersion = newVersion;
    manuscript.status = MANUSCRIPT_STATUS.REVISED_SUBMITTED;

    // Add timeline event
    manuscript.addTimelineEvent(
      'Revision Submitted',
      req.user.id,
      `Version ${newVersion} submitted${req.body.revisionNotes ? ': ' + req.body.revisionNotes : ''}`
    );

    await manuscript.save();

    // Notify editor
    if (manuscript.assignedEditor) {
      await Notification.create({
        recipient: manuscript.assignedEditor,
        type: NOTIFICATION_TYPES.REVISION_REQUEST,
        subject: 'Revised Manuscript Submitted',
        message: `Author has submitted a revision for manuscript "${manuscript.title}" (${manuscript.manuscriptId}).`,
        relatedManuscript: manuscript._id
      });

      const editor = await User.findById(manuscript.assignedEditor);
      await sendEmail({
        to: editor.email,
        subject: 'Revised Manuscript Submitted',
        template: 'revision-submitted',
        data: {
          editorName: editor.fullName,
          manuscriptId: manuscript.manuscriptId,
          title: manuscript.title,
          version: newVersion,
          revisionNotes: req.body.revisionNotes || 'No notes provided'
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Revision submitted successfully',
      data: manuscript
    });
  } catch (error) {
    next(error);
  }
};

// backend/src/controllers/manuscriptController.js - Update getManuscript to include publicUrl

exports.getManuscript = async (req, res, next) => {
  try {
    const manuscript = await Manuscript.findById(req.params.id)
      .populate('submittedBy', 'firstName lastName email affiliation')
      .populate('assignedEditor', 'firstName lastName email')
      .populate('reviews');

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    // Check authorization
    const isAuthor = manuscript.submittedBy._id.toString() === req.user.id.toString();
    const isEditor = req.user.roles.includes(ROLES.EDITOR);
    const isAdmin = req.user.roles.includes(ROLES.ADMIN);
    const isAssignedEditor = manuscript.assignedEditor && 
                            manuscript.assignedEditor._id.toString() === req.user.id.toString();
    
    const isReviewer = await Review.findOne({
      manuscript: req.params.id,
      reviewer: req.user.id
    });

    if (!isAuthor && !isEditor && !isAdmin && !isAssignedEditor && !isReviewer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this manuscript'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...manuscript.toObject(),
        publicUrl: manuscript.publicUrl, // Include public URL
        doiMetadata: isAdmin || isEditor ? manuscript.doiMetadata : undefined // Include DOI metadata for admins/editors
      }
    });
  } catch (error) {
    next(error);
  }
};
