const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, unique: true, unique: true },
    password: { type: String, default: null },
    role: { type: String, default: "user", enum: ["user", "admin", "customer", "vendor", "supplier"] },
    roleDescription: { type: String, default: null, enum: [null, "staff", "manager", "superadmin"] },
    email_verified: { type: Boolean, default: false },
    phone_verified: { type: Boolean, default: false },
    profilePicture: { type: String, default: null },
    panNumber: { type: String, default: null },
    address: { type: String, default: null },
    partyMargin: { type: Number, default: 0, required:false },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
