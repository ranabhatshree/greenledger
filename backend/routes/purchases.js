const express = require('express');
const {
    createPurchase,
    updatePurchase,
    viewPurchases,
    getPurchaseById,
    deletePurchase,
} = require('../controllers/purchasesController');
const { protect, roleBasedAccess } = require('../middlewares/authMiddleware');

const router = express.Router();

// Create Purchase
router.post(
    '/',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    createPurchase
);

// Update Purchase
router.put(
    '/:id',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    updatePurchase
);

// View All Purchases
router.get(
    '/',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    viewPurchases
);

// Get Purchase by ID
router.get(
    '/:id',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    getPurchaseById
);

// Delete Purchase
router.delete(
    '/:id',
    protect,
    roleBasedAccess(['superadmin']),
    deletePurchase
);

module.exports = router;
