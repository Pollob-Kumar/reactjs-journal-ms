const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  volume: {
    type: Number,
    required: [true, 'Volume number is required'],
    min: 1
  },
  issueNumber: {
    type: Number,
    required: [true, 'Issue number is required'],
    min: 1
  },
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  coverImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'uploads.files'
  },
  manuscripts: [{
    manuscript: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manuscript'
    },
    pageStart: Number,
    pageEnd: Number,
    addedDate: {
      type: Date,
      default: Date.now
    }
  }],
  publishedDate: Date,
  isPublished: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  year: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Unique constraint on volume and issue number
issueSchema.index({ volume: 1, issueNumber: 1 }, { unique: true });

// Virtual for issue identifier
issueSchema.virtual('issueIdentifier').get(function() {
  return `Vol. ${this.volume}, No. ${this.issueNumber} (${this.year})`;
});

// Method to publish issue
issueSchema.methods.publish = function() {
  this.isPublished = true;
  this.publishedDate = new Date();
};

// Ensure virtuals are included
issueSchema.set('toJSON', { virtuals: true });
issueSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Issue', issueSchema);