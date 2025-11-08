const { body, param, query, validationResult } = require('express-validator');

// Validation middleware to check results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const userValidation = {
  register: [
    body('firstName')
      .trim()
      .notEmpty().withMessage('First name is required')
      .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    
    body('lastName')
      .trim()
      .notEmpty().withMessage('Last name is required')
      .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('affiliation')
      .trim()
      .notEmpty().withMessage('Affiliation is required')
      .isLength({ max: 200 }).withMessage('Affiliation cannot exceed 200 characters'),
    
    body('roles')
      .optional()
      .isArray().withMessage('Roles must be an array'),
    
    body('expertise')
      .optional()
      .isArray().withMessage('Expertise must be an array'),
    
    body('orcid')
      .optional()
      .matches(/^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/).withMessage('Invalid ORCID format')
  ],

  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required')
  ],

  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    
    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    
    body('affiliation')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Affiliation cannot exceed 200 characters'),
    
    body('expertise')
      .optional()
      .isArray().withMessage('Expertise must be an array'),
    
    body('orcid')
      .optional()
      .matches(/^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/).withMessage('Invalid ORCID format')
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
    
    body('newPassword')
      .notEmpty().withMessage('New password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ]
};

// Manuscript validation rules
const manuscriptValidation = {
  submit: [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ max: 500 }).withMessage('Title cannot exceed 500 characters'),
    
    body('abstract')
      .trim()
      .notEmpty().withMessage('Abstract is required')
      .isLength({ max: 5000 }).withMessage('Abstract cannot exceed 5000 characters'),
    
    body('keywords')
      .optional()
      .isArray().withMessage('Keywords must be an array'),
    
    body('authors')
      .notEmpty().withMessage('Authors information is required')
  ],

  assignEditor: [
    body('editorId')
      .notEmpty().withMessage('Editor ID is required')
      .isMongoId().withMessage('Invalid editor ID')
  ],

  makeDecision: [
    body('decision')
      .notEmpty().withMessage('Decision is required')
      .isIn(['Accept', 'Reject', 'Revisions Required']).withMessage('Invalid decision'),
    
    body('comments')
      .optional()
      .trim()
  ]
};

// Review validation rules
const reviewValidation = {
  assign: [
    body('reviewerIds')
      .isArray({ min: 2 }).withMessage('At least 2 reviewers must be assigned')
      .custom((value) => {
        return value.every(id => id && id.length === 24);
      }).withMessage('Invalid reviewer IDs')
  ],

  submit: [
    body('confidentialComments')
      .trim()
      .notEmpty().withMessage('Confidential comments are required')
      .isLength({ max: 5000 }).withMessage('Comments cannot exceed 5000 characters'),
    
    body('authorComments')
      .trim()
      .notEmpty().withMessage('Author comments are required')
      .isLength({ max: 5000 }).withMessage('Comments cannot exceed 5000 characters'),
    
    body('recommendation')
      .notEmpty().withMessage('Recommendation is required')
      .isIn(['Accept', 'Minor Revision', 'Major Revision', 'Reject']).withMessage('Invalid recommendation')
  ],

  decline: [
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
  ]
};

// Issue validation rules
const issueValidation = {
  create: [
    body('volume')
      .notEmpty().withMessage('Volume number is required')
      .isInt({ min: 1 }).withMessage('Volume must be a positive integer'),
    
    body('issueNumber')
      .notEmpty().withMessage('Issue number is required')
      .isInt({ min: 1 }).withMessage('Issue number must be a positive integer'),
    
    body('year')
      .optional()
      .isInt({ min: 1900, max: 2100 }).withMessage('Invalid year'),
    
    body('title')
      .optional()
      .trim(),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters')
  ],

  addManuscript: [
    body('manuscriptId')
      .notEmpty().withMessage('Manuscript ID is required')
      .isMongoId().withMessage('Invalid manuscript ID'),
    
    body('pageStart')
      .optional()
      .isInt({ min: 1 }).withMessage('Page start must be a positive integer'),
    
    body('pageEnd')
      .optional()
      .isInt({ min: 1 }).withMessage('Page end must be a positive integer')
  ]
};

// MongoDB ID validation
const mongoIdValidation = {
  param: [
    param('id')
      .isMongoId().withMessage('Invalid ID format')
  ]
};

module.exports = {
  validate,
  userValidation,
  manuscriptValidation,
  reviewValidation,
  issueValidation,
  mongoIdValidation
};