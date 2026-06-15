const express = require('express');
const router = express.Router();
const { protect, roleBasedAccess } = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const {
    getAllOpeningBalances,
    getOpeningBalanceByPartyAndFiscalYear,
    createOpeningBalance,
    updateOpeningBalance,
    deleteOpeningBalance,
} = require('../controllers/openingBalanceController');

router.get(
    '/',
    protect,
    roleBasedAccess(['staff', 'admin', 'superadmin']),
    getAllOpeningBalances
);

router.get(
    '/:partyId/:fiscalYearId',
    protect,
    roleBasedAccess(['staff', 'admin', 'superadmin']),
    getOpeningBalanceByPartyAndFiscalYear
);

router.post(
    '/',
    protect,
    authorize('manage_parties'),
    createOpeningBalance
);

router.put(
    '/:id',
    protect,
    authorize('manage_parties'),
    updateOpeningBalance
);

router.delete(
    '/:id',
    protect,
    authorize('manage_parties'),
    deleteOpeningBalance
);

module.exports = router;
