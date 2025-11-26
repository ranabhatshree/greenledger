const express = require('express');
const router = express.Router();
const { createRole, getRoles, getRoleById, updateRole, deleteRole } = require('../controllers/roleController');
const { protect } = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');

// Assuming 'manage_roles' permission is needed
router.post('/', protect, authorize('manage_roles'), createRole);
router.get('/', protect, authorize('manage_roles'), getRoles);
router.get('/:id', protect, authorize('manage_roles'), getRoleById);
router.patch('/:id', protect, authorize('manage_roles'), updateRole);
router.delete('/:id', protect, authorize('manage_roles'), deleteRole);

module.exports = router;
