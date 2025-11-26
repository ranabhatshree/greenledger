const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create upload middleware for different image types
const createImageUpload = (subfolder = 'images') => {
    const uploadDir = `uploads/${subfolder}`;
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    const fileFilter = (req, file, cb) => {
        // Allow only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image file.'), false);
        }
    };

    return multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: 1024 * 1024 * 5 // 5MB limit
        }
    });
};

// Export specific upload instances
module.exports = {
    profilePictureUpload: createImageUpload('profile-pictures'),
    companyLogoUpload: createImageUpload('company-logos'),
    createImageUpload
};

