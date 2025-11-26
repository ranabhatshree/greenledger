const mongoose = require('mongoose');

const ExpensesSchema = new mongoose.Schema({
    amount: { type: Number, required: true }, // Expense amount
    invoiceNumber: { type: String, required: false }, // Invoice number
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseCategories', required: true }, // Reference to the category (ExpenseCategories model)
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }, // Reference to the company (Company model)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the creator (User model)
    description: { type: String, required: true }, // Compulsory description
    billPhotos: { type: [String], default: null }, // Array of URLs for bill photos, nullable
    invoiceDate: { type: Date, required: true }, // Invoice date
    isVatable: { type: Boolean, default: false }, // Indicates if the expense is vatable
    createdAt: { type: Date, default: Date.now }, // Creation timestamp
    updatedAt: { type: Date, default: Date.now }, // Update timestamp
});

module.exports = mongoose.model('Expenses', ExpensesSchema);
