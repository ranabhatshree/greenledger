const Party = require('../models/Party');
const {
    createPartySchema,
    updatePartySchema,
} = require('../validators/partyValidator');

// Create Party
const createParty = async (req, res, next) => {
    try {
        const value = await createPartySchema.validateAsync(req.body);

        // Check if PAN number already exists
        const existingParty = await Party.findOne({ panNumber: value.panNumber });
        if (existingParty) {
            return res.status(400).json({ 
                message: 'Party with this PAN number already exists' 
            });
        }

        const party = new Party({
            ...value,
            companyId: req.user.companyId,
            createdBy: req.user.id,
        });

        await party.save();
        res.status(201).json({ message: 'Party created successfully', party });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ message: error.details[0].message });
        }
        if (error.code === 11000) {
            return res.status(400).json({ message: 'PAN number must be unique' });
        }
        next(error);
    }
};

// Get All Parties (with pagination)
const getAllParties = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const role = req.query.role; // Optional filter by role (vendor/supplier)
        const search = req.query.search; // Optional search by name or PAN

        // Build query
        const query = { companyId: req.user.companyId };
        
        if (role && ['vendor', 'supplier'].includes(role)) {
            query.role = role;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { panNumber: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const parties = await Party.find(query)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Party.countDocuments(query);

        res.status(200).json({
            parties,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get Party by ID
const getPartyById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const party = await Party.findOne({ 
            _id: id, 
            companyId: req.user.companyId 
        }).populate('createdBy', 'name');

        if (!party) {
            return res.status(404).json({ message: 'Party not found' });
        }

        res.status(200).json({ party });
    } catch (error) {
        next(error);
    }
};

// Update Party
const updateParty = async (req, res, next) => {
    try {
        const { id } = req.params;
        const value = await updatePartySchema.validateAsync(req.body);

        const party = await Party.findOne({ 
            _id: id, 
            companyId: req.user.companyId 
        });

        if (!party) {
            return res.status(404).json({ message: 'Party not found' });
        }

        // Check if PAN number is being updated and if it conflicts
        if (value.panNumber && value.panNumber !== party.panNumber) {
            const existingParty = await Party.findOne({ 
                panNumber: value.panNumber,
                _id: { $ne: id }
            });
            if (existingParty) {
                return res.status(400).json({ 
                    message: 'Party with this PAN number already exists' 
                });
            }
        }

        Object.assign(party, value, { updatedAt: Date.now() });
        await party.save();

        res.status(200).json({ message: 'Party updated successfully', party });
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).json({ message: error.details[0].message });
        }
        if (error.code === 11000) {
            return res.status(400).json({ message: 'PAN number must be unique' });
        }
        next(error);
    }
};

// Delete Party
const deleteParty = async (req, res, next) => {
    try {
        const { id } = req.params;

        const party = await Party.findOne({ 
            _id: id, 
            companyId: req.user.companyId 
        });

        if (!party) {
            return res.status(404).json({ message: 'Party not found' });
        }

        await party.deleteOne();
        res.status(200).json({ message: 'Party deleted successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createParty,
    getAllParties,
    getPartyById,
    updateParty,
    deleteParty,
};

