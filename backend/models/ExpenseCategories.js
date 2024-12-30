const mongoose = require('mongoose');

const ExpenseCategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // Name of the category (e.g., "Travel", "Office Supplies")
    description: { type: String, default: null }, // Optional description of the category
    isActive: { type: Boolean, default: true }, // Indicates if the category is active
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the creator (User model)
    createdAt: { type: Date, default: Date.now }, // Creation timestamp
    updatedAt: { type: Date, default: Date.now }, // Update timestamp
});

module.exports = mongoose.model('ExpenseCategories', ExpenseCategorySchema);
