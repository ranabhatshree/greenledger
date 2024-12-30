const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mrp: { type: Number, required: true },
    sku: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    thumbnailURL: { type: String, required: true },
    productURL: { type: String, required: false },
    createdAt: { type: Date, default: Date.now }, // Creation timestamp
    updatedAt: { type: Date, default: Date.now }, // Update timestamp
});

module.exports = mongoose.model('Product', ProductSchema);
