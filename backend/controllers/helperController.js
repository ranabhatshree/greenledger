const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'File is required.' });
        }

        const { originalname, filename, mimetype, size, path } = req.file;

        res.status(200).json({
            message: 'Image uploaded successfully.',
            fileDetails: {
                originalName: originalname,
                fileName: filename,
                filePath: `${req.protocol}://${req.get('host')}/uploads/${filename}`, // Full file path
                mimeType: mimetype,
                size,
            },
        });
    } catch (error) {
        next(error); // Forward the error to the error handler middleware
    }
};

module.exports = { uploadFile };
