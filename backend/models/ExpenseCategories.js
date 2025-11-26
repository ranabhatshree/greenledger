const mongoose = require('mongoose');

const ExpenseCategorySchema = new mongoose.Schema({
    name: { type: String, required: true }, // Name of the category (e.g., "Travel", "Office Supplies")
    description: { type: String, default: null }, // Optional description of the category
    isActive: { type: Boolean, default: true }, // Indicates if the category is active
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }, // Reference to the company (Company model)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the creator (User model)
    createdAt: { type: Date, default: Date.now }, // Creation timestamp
    updatedAt: { type: Date, default: Date.now }, // Update timestamp
});

// Compound index to ensure unique category names per company
ExpenseCategorySchema.index({ name: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.model('ExpenseCategories', ExpenseCategorySchema);
