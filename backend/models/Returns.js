const mongoose = require('mongoose');

const ReturnsSchema = new mongoose.Schema({
    amount: { type: Number, required: true }, // Return amount
    taxableAmount: { type: Boolean, default: true }, // Indicates if the amount is taxable
    invoiceNumber: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the creator (User model)
    returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the returner (User model)
    description: { type: String, default: null }, // Optional description
    createdAt: { type: Date, default: Date.now }, // Creation timestamp
    updatedAt: { type: Date, default: Date.now }, // Update timestamp
});

module.exports = mongoose.model('Returns', ReturnsSchema);
