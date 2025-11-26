const express = require('express');
const router = express.Router();
const {
    createParty,
    getAllParties,
    getPartyById,
    updateParty,
    deleteParty,
} = require('../controllers/partyController');
const { protect } = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');

// Create Party
router.post(
    '/',
    protect,
    authorize('manage_parties'),
    createParty
);

// Get All Parties (with pagination)
router.get(
    '/',
    protect,
    authorize('view_parties'),
    getAllParties
);

// Get Party by ID
router.get(
    '/:id',
    protect,
    authorize('view_parties'),
    getPartyById
);

// Update Party
router.put(
    '/:id',
    protect,
    authorize('manage_parties'),
    updateParty
);

// Delete Party
router.delete(
    '/:id',
    protect,
    authorize('manage_parties'),
    deleteParty
);

module.exports = router;

