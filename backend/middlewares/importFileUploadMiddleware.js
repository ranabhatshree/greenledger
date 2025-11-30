const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload directory if it doesn't exist
const uploadDir = 'uploads/imports';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Format: {original_name}-{timestamp}.{ext}
        const timestamp = Date.now();
        const originalName = path.parse(file.originalname).name;
        const ext = path.extname(file.originalname);
        // Sanitize original name (remove special characters, keep only alphanumeric, dash, underscore)
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9-_]/g, '_');
        cb(null, `${sanitizedName}-${timestamp}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only image files and PDFs are allowed!'), false);
    }
};

const importFileUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 10 // 10MB limit
    }
});

// Export the multer instance so routes can call .single(), .array(), etc.
module.exports = importFileUpload;

