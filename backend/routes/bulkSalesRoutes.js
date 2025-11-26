const express = require('express');
const {
    createBulkSale,
    getAllBulkSales,
    getBulkSaleById,
    updateBulkSale,
    deleteBulkSale,
    uploadBulkSalesCSV,
} = require('../controllers/bulkSalesController');
const { protect } = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const bulkSalesUploadMiddleware = require('../middlewares/bulkSalesUploadMiddleware');

const router = express.Router();

// Upload CSV and create bulk sales
router.post(
    '/upload',
    protect,
    authorize('upload_bulk_sales'),
    bulkSalesUploadMiddleware.single('file'),
    uploadBulkSalesCSV
);

// Create Bulk Sale (manual entry)
router.post(
    '/',
    protect,
    authorize('create_bulk_sales'),
    createBulkSale
);

// Get All Bulk Sales (with filters and pagination)
router.get(
    '/',
    protect,
    authorize('view_bulk_sales'),
    getAllBulkSales
);

// Get Bulk Sale by ID
router.get(
    '/:id',
    protect,
    authorize('view_bulk_sales'),
    getBulkSaleById
);

// Update Bulk Sale
router.put(
    '/:id',
    protect,
    authorize('update_bulk_sales'),
    updateBulkSale
);

// Delete Bulk Sale
router.delete(
    '/:id',
    protect,
    authorize('delete_bulk_sales'),
    deleteBulkSale
);

module.exports = router;

