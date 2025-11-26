const express = require('express');
const router = express.Router();
const { createCompany } = require('../controllers/companyController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/company', protect, createCompany);

module.exports = router;
