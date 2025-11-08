const createTransporter = require('../config/email');

// Email templates
const emailTemplates = {
  welcome: (data) => ({
    subject: 'Welcome to Pundra University Journal Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to PUJMS!</h2>
        <p>Dear ${data.name},</p>
        <p>Thank you for registering with the Pundra University Journal Management System.</p>
        <p><strong>Your Account Details:</strong></p>
        <ul>
          <li>Email: ${data.email}</li>
          <li>Role(s): ${data.roles}</li>
        </ul>
        <p>You can now log in to the system and start using the platform.</p>
        <p>Best regards,<br>PUJMS Team</p>
      </div>
    `
  }),

  'submission-confirmation': (data) => ({
    subject: `Manuscript Submission Confirmed - ${data.manuscriptId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Manuscript Submission Confirmed</h2>
        <p>Dear ${data.name},</p>
        <p>Your manuscript has been successfully submitted to the Journal of Pundra University of Science & Technology.</p>
        <p><strong>Submission Details:</strong></p>
        <ul>
          <li>Manuscript ID: <strong>${data.manuscriptId}</strong></li>
          <li>Title: ${data.title}</li>
          <li>Submission Date: ${new Date(data.submissionDate).toLocaleDateString()}</li>
        </ul>
        <p>Your manuscript is now under editorial review. You will receive email notifications as your submission progresses through the review process.</p>
        <p>You can track the status of your submission by logging into your account.</p>
        <p>Best regards,<br>Editorial Team<br>Journal of Pundra University of Science & Technology</p>
      </div>
    `
  }),

  'new-submission-editor': (data) => ({
    subject: `New Manuscript Submission - ${data.manuscriptId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">New Manuscript Submission</h2>
        <p>Dear ${data.editorName},</p>
        <p>A new manuscript has been submitted to the journal and requires editorial attention.</p>
        <p><strong>Manuscript Details:</strong></p>
        <ul>
          <li>Manuscript ID: <strong>${data.manuscriptId}</strong></li>
          <li>Title: ${data.title}</li>
          <li>Author: ${data.authorName}</li>
          <li>Submission Date: ${new Date(data.submissionDate).toLocaleDateString()}</li>
        </ul>
        <p>Please log in to the editorial dashboard to review and assign reviewers.</p>
        <p>Best regards,<br>PUJMS System</p>
      </div>
    `
  }),

  'review-invitation': (data) => ({
    subject: `Review Invitation - ${data.manuscriptId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Review Invitation</h2>
        <p>Dear ${data.reviewerName},</p>
        <p>You have been invited to review a manuscript for the Journal of Pundra University of Science & Technology.</p>
        <p><strong>Manuscript Details:</strong></p>
        <ul>
          <li>Manuscript ID: ${data.manuscriptId}</li>
          <li>Title: ${data.title}</li>
          <li>Review Due Date: ${new Date(data.dueDate).toLocaleDateString()}</li>
        </ul>
        <p>Please respond to this invitation at your earliest convenience.</p>
        <div style="margin: 20px 0;">
          <a href="${data.acceptUrl}" style="background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Accept Invitation</a>
          <a href="${data.declineUrl}" style="background-color: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Decline Invitation</a>
        </div>
        <p>If you accept, you will have access to the manuscript through your reviewer dashboard.</p>
        <p>Thank you for your contribution to scholarly publishing.</p>
        <p>Best regards,<br>Editorial Team</p>
      </div>
    `
  }),

  'review-reminder': (data) => ({
    subject: `Reminder: Review Due - ${data.manuscriptId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Review Reminder</h2>
        <p>Dear ${data.reviewerName},</p>
        <p>This is a friendly reminder that your review for the following manuscript is due soon.</p>
        <p><strong>Manuscript Details:</strong></p>
        <ul>
          <li>Manuscript ID: ${data.manuscriptId}</li>
          <li>Title: ${data.title}</li>
          <li>Due Date: ${new Date(data.dueDate).toLocaleDateString()}</li>
        </ul>
        <p>Please log in to your reviewer dashboard to complete and submit your review.</p>
        <p>If you need an extension, please contact the editorial office.</p>
        <p>Best regards,<br>Editorial Team</p>
      </div>
    `
  }),

  'review-accepted': (data) => ({
    subject: `Review Invitation Accepted - ${data.manuscriptId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Review Invitation Accepted</h2>
        <p>Dear ${data.editorName},</p>
        <p>${data.reviewerName} has accepted the review invitation for the following manuscript:</p>
        <p><strong>Manuscript Details:</strong></p>
        <ul>
          <li>Manuscript ID: ${data.manuscriptId}</li>
          <li>Title: ${data.title}</li>
          <li>Reviewer: ${data.reviewerName}</li>
        </ul>
        <p>Best regards,<br>PUJMS System</p>
      </div>
    `
  }),

  'review-declined': (data) => ({
    subject: `Review Invitation Declined - ${data.manuscriptId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Review Invitation Declined</h2>
        <p>Dear ${data.editorName},</p>
        <p>${data.reviewerName} has declined the review invitation for the following manuscript:</p>
        <p><strong>Manuscript Details:</strong></p>
        <ul>
          <li>Manuscript ID: ${data.manuscriptId}</li>
          <li>Title: ${data.title}</li>
          <li>Reviewer: ${data.reviewerName}</li>
          <li>Reason: ${data.reason}</li>
        </ul>
        <p>Please assign another reviewer for this manuscript.</p>
        <p>Best regards,<br>PUJMS System</p>
      </div>
    `
  }),

  'review-completed': (data) => ({
    subject: `Review Completed - ${data.manuscriptId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Review Completed</h2>
        <p>Dear ${data.editorName},</p>
        <p>A review has been completed for the following manuscript:</p>
        <p><strong>Manuscript Details:</strong></p>
        <ul>
          <li>Manuscript ID: ${data.manuscriptId}</li>
          <li>Title: ${data.title}</li>
          <li>Recommendation: <strong>${data.recommendation}</strong></li>
        </ul>
        <p>Please log in to the editorial dashboard to view the complete review.</p>
        <p>Best regards,<br>PUJMS System</p>
      </div>
    `
  }),

  'editorial-decision': (data) => ({
    subject: `Editorial Decision - ${data.manuscriptId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Editorial Decision</h2>
        <p>Dear ${data.authorName},</p>
        <p>A decision has been made regarding your manuscript submitted to the Journal of Pundra University of Science & Technology.</p>
        <p><strong>Manuscript Details:</strong></p>
        <ul>
          <li>Manuscript ID: ${data.manuscriptId}</li>
          <li>Title: ${data.title}</li>
          <li>Decision: <strong style="color: ${data.decision === 'Accept' ? '#27ae60' : data.decision === 'Reject' ? '#e74c3c' : '#f39c12'};">${data.decision}</strong></li>
        </ul>
        ${data.comments ? `<p><strong>Editor's Comments:</strong></p><p style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #3498db;">${data.comments}</p>` : ''}
        ${data.decision === 'Revisions Required' ? '<p>Please log in to your account to view detailed reviewer comments and submit your revised manuscript.</p>' : ''}
        ${data.decision === 'Accept' ? '<p>Congratulations! Your paper will be scheduled for publication in an upcoming issue.</p>' : ''}
        <p>Best regards,<br>Editorial Team<br>Journal of Pundra University of Science & Technology</p>
      </div>
    `
  }),

  'revision-submitted': (data) => ({
    subject: `Revised Manuscript Submitted - ${data.manuscriptId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Revised Manuscript Submitted</h2>
        <p>Dear ${data.editorName},</p>
        <p>The author has submitted a revised version of the following manuscript:</p>
        <p><strong>Manuscript Details:</strong></p>
        <ul>
          <li>Manuscript ID: ${data.manuscriptId}</li>
          <li>Title: ${data.title}</li>
          <li>Version: ${data.version}</li>
        </ul>
        <p>Please log in to the editorial dashboard to review the revisions.</p>
        <p>Best regards,<br>PUJMS System</p>
      </div>
    `
  }),

  'editor-assignment': (data) => ({
    subject: `Manuscript Assigned - ${data.manuscriptId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Manuscript Assignment</h2>
        <p>Dear ${data.editorName},</p>
        <p>You have been assigned to handle the following manuscript:</p>
        <p><strong>Manuscript Details:</strong></p>
        <ul>
          <li>Manuscript ID: ${data.manuscriptId}</li>
          <li>Title: ${data.title}</li>
        </ul>
        <p>Please log in to the editorial dashboard to review the manuscript and assign reviewers.</p>
        <p>Best regards,<br>PUJMS System</p>
      </div>
    `
  }),

  'password-reset': (data) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Password Reset Request</h2>
        <p>Dear ${data.name},</p>
        <p>You have requested to reset your password for PUJMS.</p>
        <p>Please click the button below to reset your password:</p>
        <div style="margin: 20px 0;">
          <a href="${data.resetUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        </div>
        <p>This link will expire in ${data.validFor}.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Best regards,<br>PUJMS Team</p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (options) => {
  try {
    const { to, subject, template, data, html, text } = options;

    let emailContent = {};

    // Use template if provided
    if (template && emailTemplates[template]) {
      emailContent = emailTemplates[template](data);
    } else if (html || text) {
      emailContent = { subject, html, text };
    } else {
      throw new Error('Email content not provided');
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Pundra University Journal" <${process.env.SMTP_FROM}>`,
      to,
      subject: emailContent.subject || subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent:', info.messageId);
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Send bulk emails
const sendBulkEmails = async (emails) => {
  const results = [];
  
  for (const email of emails) {
    try {
      const result = await sendEmail(email);
      results.push({ ...result, to: email.to });
    } catch (error) {
      results.push({ 
        success: false, 
        to: email.to, 
        error: error.message 
      });
    }
  }

  return results;
};

module.exports = {
  sendEmail,
  sendBulkEmails
};