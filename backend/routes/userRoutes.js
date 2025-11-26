const express = require('express');
const router = express.Router();
const { uploadProfilePicture } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

router.post('/profile-picture', protect, upload.single('profilePicture'), uploadProfilePicture);

module.exports = router;
