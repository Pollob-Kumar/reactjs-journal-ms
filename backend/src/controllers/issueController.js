const Issue = require('../models/Issue');
const Manuscript = require('../models/Manuscript');
const { MANUSCRIPT_STATUS } = require('../config/constants');
const { assignDOI } = require('../services/doiService');
const { sendEmail } = require('../services/emailService');

// @desc    Create new issue
// @route   POST /api/issues
// @access  Private (Editor, Admin)
exports.createIssue = async (req, res, next) => {
  try {
    const { volume, issueNumber, title, description, year } = req.body;

    // Check if issue already exists
    const existingIssue = await Issue.findOne({ volume, issueNumber });
    if (existingIssue) {
      return res.status(400).json({
        success: false,
        message: `Issue ${volume}.${issueNumber} already exists`
      });
    }

    const issue = await Issue.create({
      volume,
      issueNumber,
      title,
      description,
      year: year || new Date().getFullYear(),
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: issue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all issues
// @route   GET /api/issues
// @access  Public
exports.getIssues = async (req, res, next) => {
  try {
    const { published, year, page = 1, limit = 10 } = req.query;

    let query = {};

    // Filter by published status
    if (published !== undefined) {
      query.isPublished = published === 'true';
    }

    // Filter by year
    if (year) {
      query.year = parseInt(year);
    }

    const issues = await Issue.find(query)
      .populate('manuscripts.manuscript', 'manuscriptId title authors doi')
      .populate('createdBy', 'firstName lastName')
      .sort({ year: -1, volume: -1, issueNumber: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Issue.countDocuments(query);

    res.status(200).json({
      success: true,
      data: issues,
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

// @desc    Get single issue
// @route   GET /api/issues/:id
// @access  Public
exports.getIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate({
        path: 'manuscripts.manuscript',
        select: 'manuscriptId title abstract keywords authors doi publishedDate'
      })
      .populate('createdBy', 'firstName lastName');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    res.status(200).json({
      success: true,
      data: issue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add manuscript to issue
// @route   PUT /api/issues/:id/manuscripts
// @access  Private (Editor, Admin)
exports.addManuscriptToIssue = async (req, res, next) => {
  try {
    const { manuscriptId, pageStart, pageEnd } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    if (issue.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify a published issue'
      });
    }

    const manuscript = await Manuscript.findById(manuscriptId);
    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      });
    }

    if (manuscript.status !== MANUSCRIPT_STATUS.ACCEPTED) {
      return res.status(400).json({
        success: false,
        message: 'Only accepted manuscripts can be added to an issue'
      });
    }

    // Check if manuscript already in issue
    const exists = issue.manuscripts.some(
      m => m.manuscript.toString() === manuscriptId
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Manuscript already in this issue'
      });
    }

    issue.manuscripts.push({
      manuscript: manuscriptId,
      pageStart,
      pageEnd
    });

    await issue.save();

    // Update manuscript
    manuscript.publishedIn = issue._id;
    await manuscript.save();

    res.status(200).json({
      success: true,
      message: 'Manuscript added to issue successfully',
      data: issue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove manuscript from issue
// @route   DELETE /api/issues/:id/manuscripts/:manuscriptId
// @access  Private (Editor, Admin)
exports.removeManuscriptFromIssue = async (req, res, next) => {
  try {
    const { id, manuscriptId } = req.params;

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    if (issue.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify a published issue'
      });
    }

    // Remove manuscript from issue
    issue.manuscripts = issue.manuscripts.filter(
      m => m.manuscript.toString() !== manuscriptId
    );

    await issue.save();

    // Update manuscript
    const manuscript = await Manuscript.findById(manuscriptId);
    if (manuscript) {
      manuscript.publishedIn = null;
      await manuscript.save();
    }

    res.status(200).json({
      success: true,
      message: 'Manuscript removed from issue successfully',
      data: issue
    });
  } catch (error) {
    next(error);
  }
};

// backend/src/controllers/issueController.js
// Update the publishIssue method

exports.publishIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('manuscripts');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    if (issue.status === 'Published') {
      return res.status(400).json({
        success: false,
        message: 'Issue is already published'
      });
    }

    // Update all manuscripts in the issue
    const doiResults = [];
    
    for (const manuscriptRef of issue.manuscripts) {
      const manuscript = await Manuscript.findById(manuscriptRef);
      
      if (manuscript && manuscript.status === MANUSCRIPT_STATUS.ACCEPTED) {
        // Generate public URL
        manuscript.generatePublicUrl();
        
        // Attempt DOI assignment if not already assigned
        if (!manuscript.doi) {
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
              publishedDate: new Date(),
              volume: issue.volume,
              issue: issue.issueNumber,
              year: issue.year,
              abstract: manuscript.abstract,
              url: manuscript.publicUrl,
              email: authorEmail
            };

            const doi = await assignDOI(doiData);
            manuscript.recordDoiDeposit('success', { doi, timestamp: new Date() });
            manuscript.doi = doi;
            manuscript.generatePublicUrl(); // Regenerate with DOI
            
            doiResults.push({
              manuscriptId: manuscript.manuscriptId,
              success: true,
              doi
            });
          } catch (doiError) {
            console.error(`Error assigning DOI to manuscript ${manuscript.manuscriptId}:`, doiError);
            manuscript.recordDoiDeposit('failed', null, doiError.message);
            
            doiResults.push({
              manuscriptId: manuscript.manuscriptId,
              success: false,
              error: doiError.message
            });
          }
        }

        manuscript.status = MANUSCRIPT_STATUS.PUBLISHED;
        manuscript.publishedDate = new Date();
        
        manuscript.addTimelineEvent(
          'Published',
          req.user.id,
          `Published in ${issue.issueIdentifier}${manuscript.doi ? ' with DOI: ' + manuscript.doi : ''}`
        );
        
        await manuscript.save();
      }
    }

    // Publish the issue
    issue.publish();
    await issue.save();

    res.status(200).json({
      success: true,
      message: 'Issue published successfully',
      data: {
        issue,
        manuscripts: issue.manuscripts,
        doiResults
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update issue
// @route   PUT /api/issues/:id
// @access  Private (Editor, Admin)
exports.updateIssue = async (req, res, next) => {
  try {
    const { title, description, coverImage } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    if (title) issue.title = title;
    if (description) issue.description = description;
    if (coverImage) issue.coverImage = coverImage;

    await issue.save();

    res.status(200).json({
      success: true,
      message: 'Issue updated successfully',
      data: issue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete issue
// @route   DELETE /api/issues/:id
// @access  Private (Admin)
exports.deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    if (issue.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a published issue'
      });
    }

    // Remove issue reference from all manuscripts
    await Manuscript.updateMany(
      { publishedIn: issue._id },
      { $unset: { publishedIn: 1 } }
    );

    await issue.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
