const Banner = require('../models/Banner');
const BannerBuilder = require('../models/BannerBuilder');
const cloudinary = require('cloudinary').v2;

// @desc    Get Visible Banners (Public)
// @route   GET /api/v1/banners/visible
// @route   GET /api/v1/banners
// @access  Public
const getVisibleBanners = async (req, res) => {
    try {
        // Fetch from DB and populate banner builder if needed
        const banners = await Banner.findVisible()
            .populate({
                path: 'banner_builder_id',
                select: 'name canvas_data desktop_canvas_data mobile_canvas_data'
            })
            .lean();

        res.json({
            banners,
            fetched_at: new Date()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create Banner (Admin)
// @route   POST /api/v1/admin/banners
// @access  Private/Admin
const createBanner = async (req, res) => {
    try {
        let {
            source_type, image_url, banner_builder_id, cloudinary_public_id,
            title, subtitle, offer_text,
            percentage_off, amount_off, target_url,
            start_at, end_at, priority, is_active
        } = req.body;

        // Validate source type requirements
        if (!source_type) {
            source_type = 'upload'; // Default to upload
        }

        if (source_type === 'builder' && !banner_builder_id) {
            return res.status(400).json({ message: 'Banner builder ID is required for builder type banners' });
        }

        if ((source_type === 'upload' || source_type === 'url') && !image_url) {
            return res.status(400).json({ message: 'Image URL is required for upload/URL type banners' });
        }

        // Auto-generate offer_text if missing
        if (!offer_text) {
            if (percentage_off && percentage_off > 0) {
                offer_text = `${percentage_off}% OFF`;
            } else if (amount_off && amount_off > 0) {
                offer_text = `₹${amount_off} OFF`;
            }
        }

        const bannerData = {
            source_type,
            title,
            subtitle,
            offer_text,
            percentage_off,
            amount_off,
            target_url,
            start_at,
            end_at,
            priority,
            is_active
        };

        // Add source-specific fields
        if (source_type === 'builder') {
            bannerData.banner_builder_id = banner_builder_id;
        } else {
            bannerData.image_url = image_url;
            if (cloudinary_public_id) {
                bannerData.cloudinary_public_id = cloudinary_public_id;
            }
        }

        const banner = await Banner.create(bannerData);

        res.status(201).json({ success: true, data: banner });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Get All Banners (Admin - List View)
// @route   GET /api/v1/admin/banners
// @access  Private/Admin
const listBanners = async (req, res) => {
    try {
        const pageSize = 20;
        const page = Number(req.query.pageNumber) || 1;
        const query = {};

        if (req.query.is_active !== undefined) {
            query.is_active = req.query.is_active === 'true';
        }

        const count = await Banner.countDocuments(query);
        const banners = await Banner.find(query)
            .populate({
                path: 'banner_builder_id',
                select: 'name'
            })
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({ priority: -1, createdAt: -1 }) // Show highest priority first
            .lean();

        res.json({ banners, page, pages: Math.ceil(count / pageSize), total: count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update Banner (Admin)
// @route   PUT /api/v1/admin/banners/:id
// @access  Private/Admin
const updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (banner) {
            // Handle source type change
            if (req.body.source_type && req.body.source_type !== banner.source_type) {
                // If changing source type, validate required fields
                banner.source_type = req.body.source_type;

                if (req.body.source_type === 'builder') {
                    if (!req.body.banner_builder_id) {
                        return res.status(400).json({ message: 'Banner builder ID is required for builder type' });
                    }
                    banner.banner_builder_id = req.body.banner_builder_id;
                    banner.image_url = undefined;
                    banner.cloudinary_public_id = undefined;
                } else {
                    if (!req.body.image_url) {
                        return res.status(400).json({ message: 'Image URL is required for upload/URL type' });
                    }
                    banner.image_url = req.body.image_url;
                    banner.banner_builder_id = undefined;
                    if (req.body.cloudinary_public_id) {
                        banner.cloudinary_public_id = req.body.cloudinary_public_id;
                    }
                }
            } else {
                // Update source-specific fields without changing type
                if (banner.source_type === 'builder' && req.body.banner_builder_id) {
                    banner.banner_builder_id = req.body.banner_builder_id;
                } else if (banner.source_type !== 'builder' && req.body.image_url) {
                    banner.image_url = req.body.image_url;
                    if (req.body.cloudinary_public_id) {
                        banner.cloudinary_public_id = req.body.cloudinary_public_id;
                    }
                }
            }

            banner.title = req.body.title || banner.title;
            banner.subtitle = req.body.subtitle || banner.subtitle;
            banner.target_url = req.body.target_url || banner.target_url;
            banner.priority = req.body.priority !== undefined ? req.body.priority : banner.priority;
            banner.is_active = req.body.is_active !== undefined ? req.body.is_active : banner.is_active;

            if (req.body.start_at !== undefined) banner.start_at = req.body.start_at;
            if (req.body.end_at !== undefined) banner.end_at = req.body.end_at;

            // Logic for offer updates
            if (req.body.percentage_off !== undefined) banner.percentage_off = req.body.percentage_off;
            if (req.body.amount_off !== undefined) banner.amount_off = req.body.amount_off;

            if (req.body.offer_text) {
                banner.offer_text = req.body.offer_text;
            } else {
                // Regenerate if fields changed and text not explicitly provided? 
                // Requirement says "If admin does not pass offer_text, auto-generate".
                // Usually on update we respect existing unless strictly told otherwise.
                // Let's re-generate only if they are sending null/empty string to "reset" it
                // Or if they changed the values and didn't provide text.
                if (req.body.percentage_off || req.body.amount_off) {
                    let pOff = req.body.percentage_off !== undefined ? req.body.percentage_off : banner.percentage_off;
                    let aOff = req.body.amount_off !== undefined ? req.body.amount_off : banner.amount_off;

                    if (pOff > 0) banner.offer_text = `${pOff}% OFF`;
                    else if (aOff > 0) banner.offer_text = `₹${aOff} OFF`;
                }
            }

            const updatedBanner = await banner.save();

            res.json(updatedBanner);
        } else {
            res.status(404).json({ message: 'Banner not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete Banner (Admin - Soft Delete)
// @route   DELETE /api/v1/admin/banners/:id
// @access  Private/Admin
const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (banner) {
            banner.is_active = false;
            await banner.save();

            res.json({ message: 'Banner removed (soft delete)' });
        } else {
            res.status(404).json({ message: 'Banner not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getVisibleBanners,
    createBanner,
    listBanners,
    updateBanner,
    deleteBanner
};
