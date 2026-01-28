const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY || process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET || process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'mauli-marketing',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'svg'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    },
});

// Specific storage for banner uploads with optimized settings
const bannerStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'mauli-marketing/banners',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [
            { width: 1920, height: 600, crop: 'limit' }, // Desktop banner size
            { quality: 'auto:best' },
            { fetch_format: 'auto' }
        ],
    },
});

module.exports = {
    cloudinary,
    storage,
    bannerStorage,
};
