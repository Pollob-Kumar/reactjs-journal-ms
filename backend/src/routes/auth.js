const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { userValidation, validate } = require('../utils/validators');

// Public routes
router.post('/register', userValidation.register, validate, register);
router.post('/login', userValidation.login, validate, login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, userValidation.updateProfile, validate, updateProfile);
router.put('/change-password', protect, userValidation.changePassword, validate, changePassword);
router.post('/logout', protect, logout);

module.exports = router;