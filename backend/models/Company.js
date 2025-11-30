const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    companyType: { type: String, default: null }, // Retail, Services, Manufacturing, etc.
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registrationNumber: { type: String, default: null },
    address: { type: String, required: true },
    currency: { type: String, default: 'NPR' },
    timezone: { type: String, default: 'Asia/Kathmandu' }, // Defaulting to Nepal time as per context
    fiscalYearStartMonth: { type: String, default: 'July' },
    logoUrl: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', CompanySchema);
