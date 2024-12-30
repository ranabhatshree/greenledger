const express = require('express');
const {
    createSale,
    updateSale,
    viewSales,
    deleteSale,
    getSaleById,
    createSalesByFile
} = require('../controllers/salesController');
const { protect, roleBasedAccess } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/fileUploadMiddleware');

const router = express.Router();

// Create Sale
router.post(
    '/',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    createSale
);

// Update Sale
router.put(
    '/:id',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    updateSale
);

// View Sales
router.get(
    '/',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    viewSales
);

// Get Sale by Sales ID
router.get(
    '/:id',
    protect,
    roleBasedAccess(['staff', 'manager', 'superadmin']),
    getSaleById
);

// Delete Sale
router.delete(
    '/:id',
    protect,
    roleBasedAccess(['superadmin']),
    deleteSale
);

module.exports = router;
