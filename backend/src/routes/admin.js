const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getSystemStatistics,
  getAllManuscripts,
  deleteManuscriptAdmin,
  getManuscriptRevisions,
  getRevisionDetails,
  compareRevisions,
  getDoiDeposits,
  getDoiDepositDetails,
  retryDoiDeposit,
  manuallyAssignDoi,
  bulkRetryDoiDeposits
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { userValidation, mongoIdValidation, validate } = require('../utils/validators');
const { ROLES } = require('../config/constants');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize(ROLES.ADMIN));

// System statistics
router.get('/statistics', getSystemStatistics);

// User management
router.get('/users', getAllUsers);
router.post('/users', userValidation.register, validate, createUser);
router.put('/users/:id', mongoIdValidation.param, validate, updateUser);
router.delete('/users/:id', mongoIdValidation.param, validate, deleteUser);

// Manuscript management
router.get('/manuscripts', getAllManuscripts);
router.delete('/manuscripts/:id', mongoIdValidation.param, validate, deleteManuscriptAdmin);

// Manuscript revision management
router.get('/manuscripts/:id/revisions', mongoIdValidation.param, validate, getManuscriptRevisions);
router.get('/manuscripts/:id/revisions/:version', validate, getRevisionDetails);
router.get('/manuscripts/:id/revisions/compare/:version1/:version2', validate, compareRevisions);

// DOI deposit management
router.get('/doi/deposits', getDoiDeposits);
router.get('/doi/deposits/:id', mongoIdValidation.param, validate, getDoiDepositDetails);
router.post('/doi/deposits/:id/retry', mongoIdValidation.param, validate, retryDoiDeposit);
router.post('/doi/deposits/:id/assign', mongoIdValidation.param, validate, manuallyAssignDoi);
router.post('/doi/deposits/bulk-retry', bulkRetryDoiDeposits);

module.exports = router;
