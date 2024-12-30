const multer = require('multer');

const fileUploadMiddleware = multer({
    dest: 'uploads/',
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB size limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'text/csv') {
            return cb(new Error('Only CSV files are allowed.'));
        }
        cb(null, true);
    },
});

module.exports = fileUploadMiddleware;
