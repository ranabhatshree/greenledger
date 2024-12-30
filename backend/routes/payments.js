const express = require('express');
const {
    createPayment,
    updatePayment,
    viewPayments,
    getPaymentById,
    deletePayment,
} = require('../controllers/paymentsController');
const { protect, roleBasedAccess } = require('../middlewares/authMiddleware');

const router = express.Router();

// Create Payment
router.post(
    '/',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    createPayment
);

// Update Payment
router.put(
    '/:id',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    updatePayment
);

// View All Payments
router.get(
    '/',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    viewPayments
);

// Get Payment by ID
router.get(
    '/:id',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    getPaymentById
);

// Delete Payment
router.delete(
    '/:id',
    protect,
    roleBasedAccess(['superadmin']),
    deletePayment
);

module.exports = router;
