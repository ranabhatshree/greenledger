const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadProfilePicture } = require('../controllers/userProfileController');
const { protect } = require('../middlewares/authMiddleware');
const { profilePictureUpload } = require('../middlewares/imageUpload');

// All routes require authentication (user can only access their own profile)
router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);
router.post('/upload-picture', protect, profilePictureUpload.single('profilePicture'), uploadProfilePicture);

module.exports = router;

