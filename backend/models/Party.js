const mongoose = require('mongoose');

const PartySchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    altPhone: { type: String, default: null },
    contactPerson: { type: String, default: null },
    email: { type: String, default: null },
    address: { type: String, required: true },
    panNumber: { type: String, required: true },
    isVatable: { type: Boolean, default: true },
    partyMargin: { type: Number, default: 0 },
    closingBalance: { type: Number, default: 0 },
    website: { type: String, default: null },
    role: { 
        type: String, 
        required: true, 
        enum: ['vendor', 'supplier'] 
    },
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company', 
        required: true 
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Index for faster queries
PartySchema.index({ companyId: 1, role: 1 });
PartySchema.index({ panNumber: 1 }, { unique: true });

module.exports = mongoose.model('Party', PartySchema);

