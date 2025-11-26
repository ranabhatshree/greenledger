const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/userSettingsController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/me', protect, getSettings);
router.patch('/me', protect, updateSettings);

module.exports = router;
