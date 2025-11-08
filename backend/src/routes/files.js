const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getFileStream, getFileMetadata } = require('../config/gridfs');
const Manuscript = require('../models/Manuscript');
const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

// Download file (authenticated users only)
router.get('/:fileId', protect, async (req, res, next) => {
  try {
    const fileId = req.params.fileId;

    // Verify file exists
    const metadata = await getFileMetadata(fileId);
    
    if (!metadata) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check authorization
    const manuscriptId = metadata.metadata.manuscriptId;
    
    if (manuscriptId) {
      const manuscript = await Manuscript.findById(manuscriptId);
      
      if (!manuscript) {
        return res.status(404).json({
          success: false,
          message: 'Associated manuscript not found'
        });
      }

      // Check if user has access to this file
      const isAuthor = manuscript.submittedBy.toString() === req.user.id.toString();
      const isEditor = req.user.roles.includes(ROLES.EDITOR);
      const isAdmin = req.user.roles.includes(ROLES.ADMIN);
      const isAssignedEditor = manuscript.assignedEditor && 
                               manuscript.assignedEditor.toString() === req.user.id.toString();
      
      // Check if user is assigned reviewer
      const Review = require('../models/Review');
      const isReviewer = await Review.findOne({
        manuscript: manuscriptId,
        reviewer: req.user.id,
        status: { $in: ['In Progress', 'Completed'] }
      });

      if (!isAuthor && !isEditor && !isAdmin && !isAssignedEditor && !isReviewer) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this file'
        });
      }
    }

    // Stream the file
    const fileStream = getFileStream(fileId);
    
    res.set({
      'Content-Type': metadata.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${metadata.metadata.originalName}"`
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
});

module.exports = router;