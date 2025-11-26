const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mrp: { type: Number, required: true },
    sku: { type: String, required: true }, // SKU will be unique per company
    category: { type: String, required: true },
    thumbnailURL: { type: String, required: true },
    productURL: { type: String, required: false },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }, // Reference to the company (Company model)
    createdAt: { type: Date, default: Date.now }, // Creation timestamp
    updatedAt: { type: Date, default: Date.now }, // Update timestamp
});

// Compound index to ensure unique SKU per company
ProductSchema.index({ sku: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.model('Product', ProductSchema);
