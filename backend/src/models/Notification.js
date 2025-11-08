const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../config/constants');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: Object.values(NOTIFICATION_TYPES),
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedManuscript: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manuscript'
  },
  relatedReview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentDate: Date,
  emailError: String,
  isRead: {
    type: Boolean,
    default: false
  },
  readDate: Date
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);