const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/files directory exists
const uploadDir = 'uploads/files';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Format: {original_filename}-{timestamp}.csv
        const timestamp = Date.now();
        const originalName = path.parse(file.originalname).name;
        const extension = path.extname(file.originalname);
        const filename = `${originalName}-${timestamp}${extension}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept CSV files
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel' || path.extname(file.originalname).toLowerCase() === '.csv') {
        cb(null, true);
    } else {
        cb(new Error('Only CSV files are allowed.'), false);
    }
};

const bulkSalesUploadMiddleware = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB size limit
    fileFilter: fileFilter,
});

module.exports = bulkSalesUploadMiddleware;

