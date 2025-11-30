const mongoose = require("mongoose");

const ImportSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true }, // Invoice number for the import
  amountUSD: { type: Number, required: true }, // Invoice amount in USD
  amount: { type: Number, required: true }, // Converted/local currency amount
  billPhotos: [{ type: String, default: [] }], // Array of file URLs/paths for bill or invoice images
  driveLink: { type: String, required: false, default: null }, // Link to external document storage (Google Drive, etc.)
  invoiceDate: { type: Date, required: true }, // Date of the invoice
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true 
  }, // Reference to the company importing the goods
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Reference to the creator (User model)
  supplierName: { type: String, required: true }, // Name of the supplier/vendor
  supplierAddress: { type: String, required: true }, // Address of the supplier/vendor
  description: { type: String, required: true }, // Description of the import items/details
  note: { type: String, required: false, default: null }, // Optional internal notes
  expenseDetails: [{
    title: { type: String, required: true }, // Name of the expense item (e.g., "Food Department Cost", "Agent Cost")
    amount: { type: Number, required: true, min: 0 } // Value of the expense (must be non-negative)
  }], // Array of dynamic expense entries (optional)
  createdAt: { type: Date, default: Date.now }, // Creation timestamp
  updatedAt: { type: Date, default: Date.now }, // Update timestamp
});

// Add indexes for faster queries
ImportSchema.index({ invoiceNumber: 1, companyId: 1 }, { unique: true }); // Prevent duplicate invoice numbers per company
ImportSchema.index({ companyId: 1 }); // Index for company-based queries
ImportSchema.index({ invoiceDate: 1 }); // Index for date-based queries

// Pre-save hook to update updatedAt timestamp
ImportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validation: Ensure either billPhotos or driveLink is present
ImportSchema.pre('save', function(next) {
  const hasBillPhotos = this.billPhotos && this.billPhotos.length > 0;
  const hasDriveLink = this.driveLink && this.driveLink.trim() !== '';
  
  if (!hasBillPhotos && !hasDriveLink) {
    return next(new Error('Either billPhotos or driveLink must be provided'));
  }
  next();
});

// Validation: Check for duplicate expense titles within the same import
ImportSchema.pre('save', function(next) {
  if (this.expenseDetails && this.expenseDetails.length > 0) {
    const titles = this.expenseDetails.map(exp => exp.title?.trim().toLowerCase()).filter(Boolean);
    const uniqueTitles = new Set(titles);
    
    if (titles.length !== uniqueTitles.size) {
      return next(new Error('Duplicate expense titles are not allowed. Each expense must have a unique title.'));
    }
    
    // Validate that all amounts are non-negative
    const hasNegativeAmount = this.expenseDetails.some(exp => exp.amount < 0);
    if (hasNegativeAmount) {
      return next(new Error('Expense amounts must be non-negative numbers.'));
    }
  }
  next();
});

module.exports = mongoose.model("Import", ImportSchema);

