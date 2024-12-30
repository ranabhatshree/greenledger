const express = require('express');
const {
    createExpense,
    updateExpense,
    viewExpenses,
    getExpenseById,
    deleteExpense,
} = require('../controllers/expensesController');
const { protect, roleBasedAccess } = require('../middlewares/authMiddleware');

const router = express.Router();

// Create Expense
router.post(
    '/',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    createExpense
);

// Update Expense
router.put(
    '/:id',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    updateExpense
);

// View All Expenses
router.get(
    '/',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    viewExpenses
);

// Get Expense by ID
router.get(
    '/:id',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    getExpenseById
);

// Delete Expense
router.delete(
    '/:id',
    protect,
    roleBasedAccess(['superadmin']),
    deleteExpense
);

module.exports = router;
