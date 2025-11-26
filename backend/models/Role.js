const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: null },
    permissions: [{ type: String }], // Array of permission strings
    isSystemRole: { type: Boolean, default: false },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null }, // Null for system roles or global roles if any
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Role', RoleSchema);
