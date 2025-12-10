const Banner = require('../models/Banner');
const bannerCacheService = require('../services/bannerCacheService');

// @desc    Get Visible Banners (Public)
// @route   GET /api/v1/banners/visible
// @route   GET /api/v1/banners
// @access  Public
const getVisibleBanners = async (req, res) => {
    try {
        // 1. Try Cache
        const cachedData = await bannerCacheService.getCachedVisibleBanners();
        if (cachedData) {
            return res.json(cachedData);
        }

        // 2. Fetch from DB
        const banners = await Banner.findVisible().lean();

        // 3. Cache Result
        await bannerCacheService.cacheVisibleBanners(banners);

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
            image_url, title, subtitle, offer_text,
            percentage_off, amount_off, target_url,
            start_at, end_at, priority, is_active
        } = req.body;

        // Auto-generate offer_text if missing
        if (!offer_text) {
            if (percentage_off && percentage_off > 0) {
                offer_text = `${percentage_off}% OFF`;
            } else if (amount_off && amount_off > 0) {
                offer_text = `₹${amount_off} OFF`;
            }
        }

        const banner = await Banner.create({
            image_url,
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
        });

        // Invalidate Cache
        await bannerCacheService.invalidateBannersCache();

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
            banner.image_url = req.body.image_url || banner.image_url;
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

            // Invalidate Cache
            await bannerCacheService.invalidateBannersCache();

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

            // Invalidate Cache
            await bannerCacheService.invalidateBannersCache();

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
