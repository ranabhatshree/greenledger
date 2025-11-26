const mongoose = require('mongoose');

const BulkSalesSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invoiceDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    uploadedByCSVRef: { type: String, default: null }, // Reference to the uploaded CSV file (filename)
    notes: { type: String, default: null }, // Optional notes field
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Indexes for performance
BulkSalesSchema.index({ invoiceNumber: 1, companyId: 1 });
BulkSalesSchema.index({ companyId: 1 });
BulkSalesSchema.index({ createdBy: 1 });
BulkSalesSchema.index({ uploadedByCSVRef: 1 });
BulkSalesSchema.index({ invoiceDate: 1 });

// Pre-save hook to update updatedAt
BulkSalesSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('BulkSales', BulkSalesSchema);

