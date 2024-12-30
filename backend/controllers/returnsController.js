const Returns = require('../models/Returns');
const User = require('../models/User');
const { createReturnSchema, updateReturnSchema } = require('../validators/returnsValidator');

// Create Return
const createReturn = async (req, res) => {
    try {
        const { error, value } = createReturnSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { amount, taxableAmount, invoiceNumber, returnedBy, description } = value;

        // Validate if the returner exists
        const returner = await User.findById(returnedBy);
        if (!returner) {
            return res.status(404).json({ message: 'Returned by user not found' });
        }

        const returnEntry = new Returns({
            amount,
            taxableAmount,
            invoiceNumber,
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
const updateReturn = async (req, res) => {
    try {
        const { id } = req.params;
        const { error, value } = updateReturnSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const returnEntry = await Returns.findById(id);
        if (!returnEntry) {
            return res.status(404).json({ message: 'Return not found' });
        }

        Object.assign(returnEntry, value, { updatedAt: Date.now() });
        await returnEntry.save();

        res.status(200).json({ message: 'Return updated successfully', returnEntry });
    } catch (error) {
        next(error); // Forward the error to the error handler middleware
    }
};

// View All Returns
const viewReturns = async (req, res) => {
    try {
        const returns = await Returns.find()
            .populate('createdBy', 'name email role')
            .populate('returnedBy', 'name email');

        res.status(200).json({ returns });
    } catch (error) {
        next(error); // Forward the error to the error handler middleware
    }
};

// Get Return by ID
const getReturnById = async (req, res) => {
    try {
        const { id } = req.params;

        const returnEntry = await Returns.findById(id)
            .populate('createdBy', 'name email role')
            .populate('returnedBy', 'name email');

        if (!returnEntry) {
            return res.status(404).json({ message: 'Return not found' });
        }

        res.status(200).json({ returnEntry });
    } catch (error) {
        next(error); // Forward the error to the error handler middleware
    }
};

// Delete Return
const deleteReturn = async (req, res) => {
    try {
        const { id } = req.params;

        const returnEntry = await Returns.findById(id);
        if (!returnEntry) {
            return res.status(404).json({ message: 'Return not found' });
        }

        await returnEntry.remove();
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
