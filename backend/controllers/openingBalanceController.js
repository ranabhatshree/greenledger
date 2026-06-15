const OpeningBalance = require('../models/OpeningBalance');
const Party = require('../models/Party');
const FiscalYear = require('../models/FiscalYear');
const {
    createOpeningBalanceSchema,
    updateOpeningBalanceSchema,
} = require('../validators/openingBalanceValidator');

const getAllOpeningBalances = async (req, res, next) => {
    try {
        const query = { companyId: req.user.companyId };

        if (req.query.partyId) {
            query.partyId = req.query.partyId;
        }
        if (req.query.fiscalYearId) {
            query.fiscalYearId = req.query.fiscalYearId;
        }

        const openingBalances = await OpeningBalance.find(query)
            .populate('partyId', 'name')
            .populate('fiscalYearId', 'title fromDate toDate')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            openingBalances,
        });
    } catch (error) {
        next(error);
    }
};

const getOpeningBalanceByPartyAndFiscalYear = async (req, res, next) => {
    try {
        const { partyId, fiscalYearId } = req.params;

        const party = await Party.findOne({
            _id: partyId,
            companyId: req.user.companyId,
        });
        if (!party) {
            return res.status(404).json({ message: 'Party not found' });
        }

        const fiscalYear = await FiscalYear.findOne({
            _id: fiscalYearId,
            companyId: req.user.companyId,
        });
        if (!fiscalYear) {
            return res.status(404).json({ message: 'Fiscal year not found' });
        }

        const openingBalance = await OpeningBalance.findOne({
            companyId: req.user.companyId,
            partyId,
            fiscalYearId,
        });

        res.status(200).json({
            status: 'success',
            openingBalance: openingBalance || { amount: 0, type: 'CR' },
        });
    } catch (error) {
        next(error);
    }
};

const createOpeningBalance = async (req, res, next) => {
    try {
        const value = await createOpeningBalanceSchema.validateAsync(req.body);

        const party = await Party.findOne({
            _id: value.partyId,
            companyId: req.user.companyId,
        });
        if (!party) {
            return res.status(404).json({ message: 'Party not found' });
        }

        const fiscalYear = await FiscalYear.findOne({
            _id: value.fiscalYearId,
            companyId: req.user.companyId,
        });
        if (!fiscalYear) {
            return res.status(404).json({ message: 'Fiscal year not found' });
        }

        const existing = await OpeningBalance.findOne({
            companyId: req.user.companyId,
            partyId: value.partyId,
            fiscalYearId: value.fiscalYearId,
        });

        if (existing) {
            existing.amount = value.amount;
            existing.type = value.type;
            existing.updatedAt = Date.now();
            await existing.save();

            return res.status(200).json({
                status: 'success',
                message: 'Opening balance updated successfully',
                openingBalance: existing,
            });
        }

        const openingBalance = new OpeningBalance({
            ...value,
            companyId: req.user.companyId,
        });

        await openingBalance.save();

        res.status(201).json({
            status: 'success',
            message: 'Opening balance created successfully',
            openingBalance,
        });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ message: error.details[0].message });
        }
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Opening balance already exists for this party and fiscal year',
            });
        }
        next(error);
    }
};

const updateOpeningBalance = async (req, res, next) => {
    try {
        const value = await updateOpeningBalanceSchema.validateAsync(req.body);

        const openingBalance = await OpeningBalance.findOne({
            _id: req.params.id,
            companyId: req.user.companyId,
        });

        if (!openingBalance) {
            return res.status(404).json({ message: 'Opening balance not found' });
        }

        Object.assign(openingBalance, value, { updatedAt: Date.now() });
        await openingBalance.save();

        res.status(200).json({
            status: 'success',
            message: 'Opening balance updated successfully',
            openingBalance,
        });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ message: error.details[0].message });
        }
        next(error);
    }
};

const deleteOpeningBalance = async (req, res, next) => {
    try {
        const openingBalance = await OpeningBalance.findOneAndDelete({
            _id: req.params.id,
            companyId: req.user.companyId,
        });

        if (!openingBalance) {
            return res.status(404).json({ message: 'Opening balance not found' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Opening balance deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllOpeningBalances,
    getOpeningBalanceByPartyAndFiscalYear,
    createOpeningBalance,
    updateOpeningBalance,
    deleteOpeningBalance,
};
