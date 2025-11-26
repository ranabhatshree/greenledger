const Returns = require('../models/Returns');
const User = require('../models/User');
const Party = require('../models/Party');
const { createReturnSchema, updateReturnSchema } = require('../validators/returnsValidator');

// Create Return
const createReturn = async (req, res, next) => {
    try {
        const { error, value } = createReturnSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { amount, invoiceNumber, returnedBy, description } = value;

        // Validate if the party exists
        const party = await Party.findOne({ _id: returnedBy, companyId: req.user.companyId });
        if (!party) {
            return res.status(404).json({ message: 'Party not found' });
        }

        const returnEntry = new Returns({
            amount,
            invoiceNumber,
            companyId: req.user.companyId, // Set companyId from authenticated user
            createdBy: req.user.id, // Populated by `protect` middleware
            returnedBy,
            description,
        });

        await returnEntry.save();
        res.status(201).json({ message: 'Return created successfully', returnEntry });
    } catch (error) {
        next(error); // Forward the error to the error handler middleware
    }
};

// Update Return
const updateReturn = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error, value } = updateReturnSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const returnEntry = await Returns.findOne({ _id: id, companyId: req.user.companyId });
        if (!returnEntry) {
            return res.status(404).json({ message: 'Return not found' });
        }

        // Validate returnedBy if it's being updated
        if (value.returnedBy && value.returnedBy.toString() !== returnEntry.returnedBy.toString()) {
            const party = await Party.findOne({ 
                _id: value.returnedBy, 
                companyId: req.user.companyId 
            });
            if (!party) {
                return res.status(404).json({ message: 'Party not found or does not belong to your company' });
            }
        }

        Object.assign(returnEntry, value, { updatedAt: Date.now() });
        await returnEntry.save();

        res.status(200).json({ message: 'Return updated successfully', returnEntry });
    } catch (error) {
        next(error); // Forward the error to the error handler middleware
    }
};

// View All Returns
const viewReturns = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        
        // Build date filter similar to other controllers
        let dateFilter = {};
        if (from || to) {
            dateFilter.createdAt = {};
            if (from) {
                dateFilter.createdAt.$gte = new Date(from);
            }
            if (to) {
                // Add one day to include the entire 'to' date
                const toDate = new Date(to);
                toDate.setDate(toDate.getDate() + 1);
                dateFilter.createdAt.$lt = toDate;
            }
        }

        const returns = await Returns.find({ 
            ...dateFilter, 
            companyId: req.user.companyId // Filter by company
        })
            .populate('createdBy', 'name email role')
            .populate('returnedBy', 'name phone email')
            .sort({ createdAt: -1 });

        res.status(200).json({ returns });
    } catch (error) {
        next(error); // Forward the error to the error handler middleware
    }
};

// Get Return by ID
const getReturnById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const returnEntry = await Returns.findOne({ 
            _id: id, 
            companyId: req.user.companyId 
        })
            .populate('createdBy', 'name email role')
            .populate('returnedBy', 'name phone email');

        if (!returnEntry) {
            return res.status(404).json({ message: 'Return not found' });
        }

        res.status(200).json({ returnEntry });
    } catch (error) {
        next(error); // Forward the error to the error handler middleware
    }
};

// Delete Return
const deleteReturn = async (req, res, next) => {
    try {
        const { id } = req.params;

        const returnEntry = await Returns.findOne({ _id: id, companyId: req.user.companyId });
        if (!returnEntry) {
            return res.status(404).json({ message: 'Return not found' });
        }

        await returnEntry.deleteOne();
        res.status(200).json({ message: 'Return deleted successfully' });
    } catch (error) {
        next(error); // Forward the error to the error handler middleware
    }
};

module.exports = {
    createReturn,
    updateReturn,
    viewReturns,
    getReturnById,
    deleteReturn,
};
