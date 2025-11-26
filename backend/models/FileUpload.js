const mongoose = require('mongoose');

const FileUploadSchema = new mongoose.Schema({
    originalFilename: { type: String, required: true },
    storedFilename: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    uploadType: { type: String, default: 'bulk_sales_csv' }, // Type of upload
    recordCount: { type: Number, default: 0 }, // Number of records processed from this file
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    errorMessage: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Indexes for performance
FileUploadSchema.index({ uploadedBy: 1 });
FileUploadSchema.index({ companyId: 1 });
FileUploadSchema.index({ storedFilename: 1 });
FileUploadSchema.index({ createdAt: 1 });

// Pre-save hook to update updatedAt
FileUploadSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('FileUpload', FileUploadSchema);

