const express = require('express');
const {
    createCategory,
    updateCategory,
    viewCategories,
    getCategoryById,
    deleteCategory,
} = require('../controllers/expenseCategoriesController');
const { protect, roleBasedAccess } = require('../middlewares/authMiddleware');

const router = express.Router();

// Create Expense Category
router.post(
    '/',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    createCategory
);

// Update Expense Category
router.put(
    '/:id',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    updateCategory
);

// View All Expense Categories
router.get(
    '/',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    viewCategories
);

// Get Expense Category by ID
router.get(
    '/:id',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    getCategoryById
);

// Delete Expense Category
router.delete(
    '/:id',
    protect,
    roleBasedAccess(['superadmin']),
    deleteCategory
);

module.exports = router;
