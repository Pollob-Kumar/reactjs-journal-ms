const mongoose = require('mongoose');
const { MANUSCRIPT_STATUS, FILE_TYPES } = require('../config/constants');

const authorSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  affiliation: {
    type: String,
    required: true,
    trim: true
  },
  orcid: {
    type: String,
    trim: true
  },
  isCorresponding: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const fileSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: Object.values(FILE_TYPES),
    required: true
  },
  size: Number,
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const revisionSchema = new mongoose.Schema({
  version: {
    type: Number,
    required: true
  },
  files: [fileSchema],
  responseToReviewers: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'uploads.files'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const manuscriptSchema = new mongoose.Schema({
  manuscriptId: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [500, 'Title cannot exceed 500 characters']
  },
  abstract: {
    type: String,
    required: [true, 'Abstract is required'],
    maxlength: [5000, 'Abstract cannot exceed 5000 characters']
  },
  keywords: [{
    type: String,
    trim: true
  }],
  authors: {
    type: [authorSchema],
    validate: {
      validator: function(authors) {
        return authors && authors.length > 0;
      },
      message: 'At least one author is required'
    }
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: Object.values(MANUSCRIPT_STATUS),
    default: MANUSCRIPT_STATUS.SUBMITTED
  },
  files: [fileSchema],
  revisions: [revisionSchema],
  currentVersion: {
    type: Number,
    default: 1
  },
  assignedEditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  editorDecision: {
    decision: {
      type: String,
      enum: ['Accept', 'Reject', 'Revisions Required']
    },
    comments: String,
    decidedAt: Date,
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  publishedIn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  },
  doi: {
    type: String,
    trim: true
  },
  publishedDate: Date,
  submissionDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  timeline: [{
    event: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: String
  }]
}, {
  timestamps: true
});

// Generate manuscript ID before saving
manuscriptSchema.pre('save', async function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.manuscriptId = `PUJMS-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  this.lastUpdated = Date.now();
  next();
});

// Add timeline event method
manuscriptSchema.methods.addTimelineEvent = function(event, performedBy, details) {
  this.timeline.push({
    event,
    performedBy,
    details,
    timestamp: new Date()
  });
};

// Indexes for search optimization
manuscriptSchema.index({ title: 'text', abstract: 'text', keywords: 'text' });
manuscriptSchema.index({ status: 1 });
manuscriptSchema.index({ submittedBy: 1 });
manuscriptSchema.index({ assignedEditor: 1 });
manuscriptSchema.index({ manuscriptId: 1 });

module.exports = mongoose.model('Manuscript', manuscriptSchema);