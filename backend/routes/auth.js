const express = require('express');
const { registerUser, loginUser, addPartyByAdmin,  getUsersByRole, logoutUser, resetPassword, getSingleUser} = require('../controllers/authController');
const { protect, roleBasedAccess } = require('../middlewares/authMiddleware');
const router = express.Router();

// Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Add Party by Admin Route
router.post(
    '/add-party',
    protect, // Ensure the user is authenticated
    roleBasedAccess(['superadmin']), // Restrict to superadmin role
    addPartyByAdmin // Controller function
);

// Get Users by Role
router.get(
    '/users-by-role',
    protect,
    roleBasedAccess(['admin', 'superadmin']), // Allow admin and superadmin to access
    getUsersByRole
);

// Logout Users
router.post(
    '/logout',
    protect,
    logoutUser
);

// 
router.post(
    '/reset-password',
    resetPassword
);

router.get('/user/:userId', protect, roleBasedAccess(['staff', 'admin', 'superadmin']), getSingleUser);

module.exports = router;
