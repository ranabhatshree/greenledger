const mongoose = require('mongoose');

const FiscalYearSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    title: { type: String, required: true },
    shortDescription: { type: String, default: null },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

FiscalYearSchema.index({ companyId: 1, isActive: 1 });
FiscalYearSchema.index({ companyId: 1, fromDate: -1 });

module.exports = mongoose.model('FiscalYear', FiscalYearSchema);
