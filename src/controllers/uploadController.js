const uploadImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Cloudinary automatically handles the upload via multer storage
    // req.file.path contains the Cloudinary URL
    // req.file.filename contains the public_id for deletion

    res.status(200).json({
        success: true,
        url: req.file.path,
        filename: req.file.filename,
        public_id: req.file.filename, // For cloudinary deletion
        originalname: req.file.originalname
    });
};

const uploadImages = (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const urls = req.files.map(file => file.path);

    res.status(200).json({
        success: true,
        urls: urls
    });
};

module.exports = {
    uploadImage,
    uploadImages
};
