const mongoose = require("mongoose");

const PurchasesSchema = new mongoose.Schema({
  amount: { type: Number, required: true }, // Purchase amount
  invoiceNumber: { type: String, required: true }, // Invoice number
  invoiceDate: { type: Date, required: true }, // Invoice date
  isVatable: { type: Boolean, default: true }, // Indicates if the amount is taxable
  billPhotos: [{ type: String, default: [] }], // Image URLs
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }, // Reference to the company (Company model)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Reference to the creator (User model)
  suppliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Party",
    required: true,
  }, // Reference to the supplier (Party model)
  description: { type: String, required: true }, // required description
  note: { type: String, required: false, default: null }, // note
  createdAt: { type: Date, default: Date.now }, // Creation timestamp
  updatedAt: { type: Date, default: Date.now }, // Update timestamp
});

module.exports = mongoose.model("Purchases", PurchasesSchema);
