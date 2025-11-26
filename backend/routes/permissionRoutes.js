const express = require('express');
const router = express.Router();
const { getAllPermissions } = require('../controllers/permissionController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getAllPermissions);

module.exports = router;
