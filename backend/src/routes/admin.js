const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getSystemStatistics,
  getAllManuscripts,
  deleteManuscriptAdmin
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

module.exports = router;