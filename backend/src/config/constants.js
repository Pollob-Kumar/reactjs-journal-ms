module.exports = {
  // User Roles
  ROLES: {
    AUTHOR: 'author',
    REVIEWER: 'reviewer',
    EDITOR: 'editor',
    ADMIN: 'admin'
  },

  // Manuscript Status
  MANUSCRIPT_STATUS: {
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    REVISIONS_REQUIRED: 'Revisions Required',
    REVISED_SUBMITTED: 'Revised Submitted',
    ACCEPTED: 'Accepted',
    REJECTED: 'Rejected',
    PUBLISHED: 'Published'
  },

  // Review Status
  REVIEW_STATUS: {
    PENDING_INVITATION: 'Pending Invitation',
    INVITATION_SENT: 'Invitation Sent',
    ACCEPTED: 'Accepted',
    DECLINED: 'Declined',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed'
  },

  // Review Recommendations
  REVIEW_RECOMMENDATION: {
    ACCEPT: 'Accept',
    MINOR_REVISION: 'Minor Revision',
    MAJOR_REVISION: 'Major Revision',
    REJECT: 'Reject'
  },

  // Editorial Decisions
  EDITORIAL_DECISION: {
    ACCEPT: 'Accept',
    REJECT: 'Reject',
    REVISIONS_REQUIRED: 'Revisions Required'
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    SUBMISSION_CONFIRMATION: 'submission_confirmation',
    REVIEW_INVITATION: 'review_invitation',
    REVIEW_REMINDER: 'review_reminder',
    REVISION_REQUEST: 'revision_request',
    FINAL_DECISION: 'final_decision',
    NEW_SUBMISSION: 'new_submission',
    REVIEW_COMPLETED: 'review_completed',
    PUBLICATION_NOTICE: 'publication_notice'
  },

  // File Types
  FILE_TYPES: {
    MANUSCRIPT: 'manuscript',
    SUPPLEMENTARY: 'supplementary',
    REVISION: 'revision',
    RESPONSE_TO_REVIEWERS: 'response'
  }
};