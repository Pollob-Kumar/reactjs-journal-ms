const mongoose = require('mongoose');
const { REVIEW_STATUS, REVIEW_RECOMMENDATION } = require('../config/constants');

const reviewSchema = new mongoose.Schema({
  manuscript: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manuscript',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: Object.values(REVIEW_STATUS),
    default: REVIEW_STATUS.INVITATION_SENT
  },
  invitationSentDate: {
    type: Date,
    default: Date.now
  },
  invitationResponse: {
    responded: {
      type: Boolean,
      default: false
    },
    accepted: Boolean,
    responseDate: Date,
    declineReason: String
  },
  dueDate: {
    type: Date,
    default: function() {
      // Default 14 days from invitation
      return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }
  },
  reviewRound: {
    type: Number,
    default: 1
  },
  confidentialComments: {
    type: String,
    maxlength: [5000, 'Confidential comments cannot exceed 5000 characters']
  },
  authorComments: {
    type: String,
    maxlength: [5000, 'Author comments cannot exceed 5000 characters']
  },
  recommendation: {
    type: String,
    enum: Object.values(REVIEW_RECOMMENDATION)
  },
  submittedDate: Date,
  remindersSent: [{
    type: Date
  }],
  lastReminderDate: Date
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ manuscript: 1, reviewer: 1 });
reviewSchema.index({ reviewer: 1, status: 1 });
reviewSchema.index({ manuscript: 1, status: 1 });

// Method to accept invitation
reviewSchema.methods.acceptInvitation = function() {
  this.invitationResponse.responded = true;
  this.invitationResponse.accepted = true;
  this.invitationResponse.responseDate = new Date();
  this.status = REVIEW_STATUS.IN_PROGRESS;
};

// Method to decline invitation
reviewSchema.methods.declineInvitation = function(reason) {
  this.invitationResponse.responded = true;
  this.invitationResponse.accepted = false;
  this.invitationResponse.responseDate = new Date();
  this.invitationResponse.declineReason = reason;
  this.status = REVIEW_STATUS.DECLINED;
};

// Method to submit review
reviewSchema.methods.submitReview = function(confidentialComments, authorComments, recommendation) {
  this.confidentialComments = confidentialComments;
  this.authorComments = authorComments;
  this.recommendation = recommendation;
  this.submittedDate = new Date();
  this.status = REVIEW_STATUS.COMPLETED;
};

module.exports = mongoose.model('Review', reviewSchema);