// backend/src/controllers/publicController.js - Add public file access

const Manuscript = require('../models/Manuscript');
const { getFileStream } = require('../config/gridfs');
const { MANUSCRIPT_STATUS } = require('../config/constants');

// @desc    Get public article by DOI
// @route   GET /api/public/articles/doi/:doi
// @access  Public
exports.getArticleByDoi = async (req, res, next) => {
  try {
    const doi = decodeURIComponent(req.params.doi);

    const manuscript = await Manuscript.findOne({ 
      doi,
      status: MANUSCRIPT_STATUS.PUBLISHED 
    })
      .populate('submittedBy', 'firstName lastName email affiliation')
      .populate('assignedEditor', 'firstName lastName');

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        manuscriptId: manuscript.manuscriptId,
        title: manuscript.title,
        abstract: manuscript.abstract,
        keywords: manuscript.keywords,
        authors: manuscript.authors,
        doi: manuscript.doi,
        publicUrl: manuscript.publicUrl,
        publishedDate: manuscript.publishedDate,
        submissionDate: manuscript.submissionDate,
        files: manuscript.files.map(f => ({
          fileId: f.fileId,
          originalName: f.originalName,
          size: f.size,
          fileType: f.fileType
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download public article file
// @route   GET /api/public/articles/:manuscriptId/download
// @access  Public
exports.downloadPublicArticle = async (req, res, next) => {
  try {
    const manuscript = await Manuscript.findOne({
      $or: [
        { _id: req.params.manuscriptId },
        { manuscriptId: req.params.manuscriptId }
      ],
      status: MANUSCRIPT_STATUS.PUBLISHED
    });

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Article not found or not published'
      });
    }

    // Get the main manuscript file (usually the first PDF)
    const mainFile = manuscript.files.find(f => 
      f.fileType === 'manuscript' || f.originalName.toLowerCase().endsWith('.pdf')
    ) || manuscript.files[0];

    if (!mainFile) {
      return res.status(404).json({
        success: false,
        message: 'Article file not found'
      });
    }

    // Stream the file
    const fileStream = getFileStream(mainFile.fileId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${manuscript.manuscriptId}.pdf"`,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'X-DOI': manuscript.doi || '',
      'X-Manuscript-ID': manuscript.manuscriptId
    });

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file'
        });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get article view/download statistics
// @route   GET /api/public/articles/:manuscriptId/stats
// @access  Public
exports.getArticleStats = async (req, res, next) => {
  try {
    const manuscript = await Manuscript.findOne({
      $or: [
        { _id: req.params.manuscriptId },
        { manuscriptId: req.params.manuscriptId }
      ],
      status: MANUSCRIPT_STATUS.PUBLISHED
    });

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // For future implementation: track views/downloads
    res.status(200).json({
      success: true,
      data: {
        manuscriptId: manuscript.manuscriptId,
        views: 0, // Implement view tracking
        downloads: 0, // Implement download tracking
        publicUrl: manuscript.publicUrl,
        doi: manuscript.doi
      }
    });
  } catch (error) {
    next(error);
  }
};
