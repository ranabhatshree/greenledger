const mongoose = require('mongoose');

const ReturnsSchema = new mongoose.Schema({
    amount: { type: Number, required: true }, // Return amount
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true }, // Invoice date
    type: {
        type: String,
        required: true,
        enum: ['credit_note', 'debit_note'],
        default: 'credit_note'
    },
    billPhotos: [{ type: String, default: [] }], // Image URLs
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }, // Reference to the company (Company model)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the creator (User model)
    returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true }, // Reference to the returner (Party model)
    description: { type: String, default: null }, // Optional description
    createdAt: { type: Date, default: Date.now }, // Creation timestamp
    updatedAt: { type: Date, default: Date.now }, // Update timestamp
});

module.exports = mongoose.model('Returns', ReturnsSchema);
