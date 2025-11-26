const mongoose = require('mongoose');

// Define schema
const SalesSchema = new mongoose.Schema({
    billingParty: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true }, // Reference to Party
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }, // Reference to the company (Company model)

    // Option 1: Item-based entry (referencing products)
    items: [
        {
            productId: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'Product', // Reference to Product model
                required: true 
            },
            name: { type: String, default: null, required: false },
            quantity: { type: Number, default: null, required: true },
            rate: { type: Number, default: null, required: true },
            amount: { type: Number, required: true },
        }
    ],

    // Option 2: Direct entry (without products)
    directEntry: {
        description: { type: String, default: null },
        amount: { type: Number, default: 0 }
    },

    // New fields for discount
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0 },

    // Added fields
    subTotal: { type: Number, default: 0, nullable: true },
    taxableAmount: { type: Number, default: 0, nullable: true },
    vatAmount: { type: Number, default: 0, nullable: true },
    grandTotal: { type: Number, default: 0, nullable: true },

    billPhotos: [{ type: String, default: [] }], // Image URLs
    note: { type: String, default: null },
    isVatable: { type: Boolean, default: true }, // Taxable flag

    // Edit history logs
    editHistoryLogs: [{
        description: { type: String, required: true },
        editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        editedAt: { type: Date, default: Date.now }
    }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Pre-save hook to enforce validation logic
SalesSchema.pre('save', function (next) {
    // Validation: Ensure only one mode of entry is used (items or directEntry)
    const hasItems = this.items && this.items.length > 0;
    const hasDirectEntry = this.directEntry && this.directEntry.description;

    if (hasItems && hasDirectEntry) {
        return next(new Error('Cannot use both item-based entry and direct entry at the same time.'));
    }

    if (!hasItems && !hasDirectEntry) {
        return next(new Error('Either items or direct entry must be provided.'));
    }

    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Sales', SalesSchema);
