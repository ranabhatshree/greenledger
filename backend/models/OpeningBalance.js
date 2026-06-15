const mongoose = require('mongoose');

const OpeningBalanceSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    partyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party',
        required: true,
    },
    fiscalYearId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FiscalYear',
        required: true,
    },
    amount: { type: Number, required: true },
    type: { type: String, required: true, enum: ['CR', 'DR'] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

OpeningBalanceSchema.index(
    { companyId: 1, partyId: 1, fiscalYearId: 1 },
    { unique: true }
);

module.exports = mongoose.model('OpeningBalance', OpeningBalanceSchema);
