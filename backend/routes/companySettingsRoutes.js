const express = require('express');
const router = express.Router();
const { getCompanySettings, updateCompanySettings, uploadCompanyLogo } = require('../controllers/companySettingsController');
const { protect } = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const { companyLogoUpload } = require('../middlewares/imageUpload');

// All routes require authentication and admin access
router.get('/', protect, authorize('manage_company_settings'), getCompanySettings);
router.put('/', protect, authorize('manage_company_settings'), updateCompanySettings);
router.post('/upload-logo', protect, authorize('manage_company_settings'), companyLogoUpload.single('logo'), uploadCompanyLogo);

module.exports = router;

