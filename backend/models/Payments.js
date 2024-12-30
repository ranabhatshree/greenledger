const mongoose = require('mongoose');

const PaymentsSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['cheque', 'fonepay', 'cash', 'bank_transfer'], // Updated payment types
    },
    amount: { type: Number, required: true }, // Payment amount
    billPhotos: { type: [String], default: [] }, // Array of bill photos, default empty
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the creator (User model)
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the payer (User model)
    description: { type: String, default: null }, // Optional description
    invoiceNumber: { type: String, default: null }, // Optional invoice number
    invoiceDate: { type: Date, required: true }, // Required payment received date
    receivedOrPaid: { type: Boolean, required: false, default: true }, // Received -> 1,  Paid -> 0
    paymentDepositedDate: { type: Date, default: null }, // Optional payment deposited date
    createdAt: { type: Date, default: Date.now }, // Creation timestamp
    updatedAt: { type: Date, default: Date.now }, // Update timestamp
});

module.exports = mongoose.model('Payments', PaymentsSchema);
