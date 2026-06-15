const express = require('express');
const router = express.Router();
const { protect, roleBasedAccess } = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const {
    getAllFiscalYears,
    getActiveFiscalYear,
    createFiscalYear,
    updateFiscalYear,
    deleteFiscalYear,
} = require('../controllers/fiscalYearController');

router.get(
    '/active',
    protect,
    roleBasedAccess(['staff', 'admin', 'superadmin']),
    getActiveFiscalYear
);

router.get(
    '/',
    protect,
    roleBasedAccess(['staff', 'admin', 'superadmin']),
    getAllFiscalYears
);

router.post(
    '/',
    protect,
    authorize('manage_company_settings'),
    createFiscalYear
);

router.put(
    '/:id',
    protect,
    authorize('manage_company_settings'),
    updateFiscalYear
);

router.delete(
    '/:id',
    protect,
    authorize('manage_company_settings'),
    deleteFiscalYear
);

module.exports = router;
