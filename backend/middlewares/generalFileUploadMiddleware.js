const multer = require('multer');
const path = require('path');
const crypto = require('crypto');


// Function to create a dynamic multer instance
const createFileUploadMiddleware = (allowedTypes, maxFileSize = 5 * 1024 * 1024) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/'); // Save files to the 'uploads/' directory
        },
        filename: (req, file, cb) => {
            const randomString = crypto.randomBytes(24).toString('hex'); // Generate a 32-character random string
            const uniqueSuffix = `${randomString}`;
            cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    });

    const fileFilter = (req, file, cb) => {
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
        }
        cb(null, true);
    };

    return multer({
        storage,
        limits: { fileSize: maxFileSize }, // Default max file size is 5MB
        fileFilter,
    });
};

module.exports = createFileUploadMiddleware;
