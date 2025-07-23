const express = require('express');
const { registerUser, loginUser, addPartyByAdmin,  getUsersByRole, logoutUser, resetPassword, confirmResetPassword, getSingleUser} = require('../controllers/authController');
const { protect, roleBasedAccess } = require('../middlewares/authMiddleware');
const router = express.Router();

// Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Add new party by admin/superadmin
router.post(
    '/add-party',
    protect,
    roleBasedAccess(['admin', 'superadmin']),
    addPartyByAdmin
);

// Get users by role
router.get('/users-by-role', protect, roleBasedAccess(['staff', 'admin', 'superadmin']), getUsersByRole);

// Logout Users
router.post(
    '/logout',
    protect,
    logoutUser
);

// Request Password Reset
router.post(
    '/reset-password',
    resetPassword
);

// Confirm Password Reset with Token
router.post(
    '/confirm-reset-password',
    confirmResetPassword
);

router.get('/user/:userId', protect, roleBasedAccess(['staff', 'admin', 'superadmin']), getSingleUser);

module.exports = router;
