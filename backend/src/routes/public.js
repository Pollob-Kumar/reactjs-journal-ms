const express = require('express');
const router = express.Router();
const {
  searchArticles,
  getCurrentIssue,
  getArchivedIssues,
  getArticleById,
  getArticleByDoi,
  downloadPublicArticle,
  getArticleStats
} = require('../controllers/publicController');
const { getFileStream } = require('../config/gridfs');
const Manuscript = require('../models/Manuscript');
const mongoose = require('mongoose');

// Search published articles
router.get('/search', searchArticles);

// Get current issue
router.get('/current-issue', getCurrentIssue);

// Get archived issues
router.get('/archives', getArchives);

// Get published article by manuscript ID
router.get('/articles/:manuscriptId', getArticle);

// Get public statistics
router.get('/stats', getPublicStats);

// Download published article PDF
router.get('/articles/:manuscriptId/download', async (req, res, next) => {
  try {
    const manuscript = await Manuscript.findOne({
      manuscriptId: req.params.manuscriptId,
      status: 'Published'
    });

    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Get the main manuscript file
    const mainFile = manuscript.files.find(f => f.fileType === 'manuscript');
    
    if (!mainFile) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const fileStream = getFileStream(mainFile.fileId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${manuscript.manuscriptId}.pdf"`
    });

    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

// Public article access
router.get('/articles/doi/:doi', getArticleByDoi);
router.get('/articles/:manuscriptId/download', downloadPublicArticle);
router.get('/articles/:manuscriptId/stats', getArticleStats);

module.exports = router;
