const FiscalYear = require('../models/FiscalYear');
const {
    createFiscalYearSchema,
    updateFiscalYearSchema,
} = require('../validators/fiscalYearValidator');

const deactivateOtherFiscalYears = async (companyId, excludeId = null) => {
    const query = { companyId, isActive: true };
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    await FiscalYear.updateMany(query, { isActive: false, updatedAt: Date.now() });
};

const getAllFiscalYears = async (req, res, next) => {
    try {
        const fiscalYears = await FiscalYear.find({ companyId: req.user.companyId })
            .sort({ fromDate: -1 });

        res.status(200).json({
            status: 'success',
            fiscalYears,
        });
    } catch (error) {
        next(error);
    }
};

const getActiveFiscalYear = async (req, res, next) => {
    try {
        const fiscalYear = await FiscalYear.findOne({
            companyId: req.user.companyId,
            isActive: true,
        }).sort({ fromDate: -1 });

        if (!fiscalYear) {
            return res.status(404).json({
                status: 'error',
                message: 'No active fiscal year found',
            });
        }

        res.status(200).json({
            status: 'success',
            fiscalYear,
        });
    } catch (error) {
        next(error);
    }
};

const createFiscalYear = async (req, res, next) => {
    try {
        const value = await createFiscalYearSchema.validateAsync(req.body);

        if (new Date(value.fromDate) > new Date(value.toDate)) {
            return res.status(400).json({
                message: 'From date cannot be later than to date',
            });
        }

        if (value.isActive) {
            await deactivateOtherFiscalYears(req.user.companyId);
        }

        const fiscalYear = new FiscalYear({
            ...value,
            companyId: req.user.companyId,
        });

        await fiscalYear.save();

        res.status(201).json({
            status: 'success',
            message: 'Fiscal year created successfully',
            fiscalYear,
        });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ message: error.details[0].message });
        }
        next(error);
    }
};

const updateFiscalYear = async (req, res, next) => {
    try {
        const value = await updateFiscalYearSchema.validateAsync(req.body);

        const fiscalYear = await FiscalYear.findOne({
            _id: req.params.id,
            companyId: req.user.companyId,
        });

        if (!fiscalYear) {
            return res.status(404).json({ message: 'Fiscal year not found' });
        }

        const fromDate = value.fromDate || fiscalYear.fromDate;
        const toDate = value.toDate || fiscalYear.toDate;

        if (new Date(fromDate) > new Date(toDate)) {
            return res.status(400).json({
                message: 'From date cannot be later than to date',
            });
        }

        if (value.isActive) {
            await deactivateOtherFiscalYears(req.user.companyId, fiscalYear._id);
        }

        Object.assign(fiscalYear, value, { updatedAt: Date.now() });
        await fiscalYear.save();

        res.status(200).json({
            status: 'success',
            message: 'Fiscal year updated successfully',
            fiscalYear,
        });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ message: error.details[0].message });
        }
        next(error);
    }
};

const deleteFiscalYear = async (req, res, next) => {
    try {
        const fiscalYear = await FiscalYear.findOneAndDelete({
            _id: req.params.id,
            companyId: req.user.companyId,
        });

        if (!fiscalYear) {
            return res.status(404).json({ message: 'Fiscal year not found' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Fiscal year deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllFiscalYears,
    getActiveFiscalYear,
    createFiscalYear,
    updateFiscalYear,
    deleteFiscalYear,
};
