const mongoose = require('mongoose');

const OnboardingSessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    step: { type: String, default: 'company_setup', enum: ['company_setup', 'profile_upload', 'completed'] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OnboardingSession', OnboardingSessionSchema);
