const mongoose = require('mongoose');

const UserSettingsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    language: { type: String, default: 'en' },
    theme: { type: String, default: 'system', enum: ['light', 'dark', 'system'] },
    dateFormat: { type: String, default: 'YYYY-MM-DD' },
    notificationsEnabled: { type: Boolean, default: true },
    currencyFormat: { type: String, default: 'standard' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserSettings', UserSettingsSchema);
