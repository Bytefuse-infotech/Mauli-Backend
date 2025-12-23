const BannerBuilder = require('../models/BannerBuilder');

/**
 * @desc    Get all banner builders (Admin)
 * @route   GET /api/v1/admin/banner-builder
 * @access  Private/Admin
 */
const getAllBannerBuilders = async (req, res) => {
    try {
        const pageSize = 20;
        const page = Number(req.query.page) || 1;
        const query = {};

        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Search by name
        if (req.query.search) {
            query.$text = { $search: req.query.search };
        }

        const count = await BannerBuilder.countDocuments(query);
        const banners = await BannerBuilder.find(query)
            .limit(pageSize)
            .skip(pageSize * (page - 1))
            .sort({ priority: -1, updatedAt: -1 })
            .lean();

        res.json({
            success: true,
            data: banners,
            page,
            pages: Math.ceil(count / pageSize),
            total: count
        });
    } catch (error) {
        console.error('Error fetching banner builders:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get single banner builder by ID
 * @route   GET /api/v1/admin/banner-builder/:id
 * @access  Private/Admin
 */
const getBannerBuilderById = async (req, res) => {
    try {
        const banner = await BannerBuilder.findById(req.params.id).lean();

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        res.json({ success: true, data: banner });
    } catch (error) {
        console.error('Error fetching banner builder:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Create new banner builder
 * @route   POST /api/v1/admin/banner-builder
 * @access  Private/Admin
 */
const createBannerBuilder = async (req, res) => {
    try {
        const bannerData = {
            ...req.body,
            createdBy: req.user?._id || null
        };

        const banner = await BannerBuilder.create(bannerData);

        // Emit WebSocket event for real-time updates
        if (req.app.get('io')) {
            req.app.get('io').emit('banner:created', banner);
        }

        res.status(201).json({
            success: true,
            data: banner,
            message: 'Banner created successfully'
        });
    } catch (error) {
        console.error('Error creating banner builder:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server Error'
        });
    }
};

/**
 * @desc    Update banner builder
 * @route   PUT /api/v1/admin/banner-builder/:id
 * @access  Private/Admin
 */
const updateBannerBuilder = async (req, res) => {
    try {
        const banner = await BannerBuilder.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        // Deep merge update data
        const updateData = req.body;

        // Increment version for undo/redo tracking
        updateData.version = (banner.version || 0) + 1;

        const updatedBanner = await BannerBuilder.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        // Emit WebSocket event for real-time preview updates
        if (req.app.get('io')) {
            req.app.get('io').emit('banner:updated', updatedBanner);
            // Also emit to specific room for this banner
            req.app.get('io').to(`banner:${req.params.id}`).emit('banner:preview', updatedBanner);
        }

        res.json({
            success: true,
            data: updatedBanner,
            message: 'Banner updated successfully'
        });
    } catch (error) {
        console.error('Error updating banner builder:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server Error'
        });
    }
};

/**
 * @desc    Delete banner builder (soft delete by setting status to 'expired')
 * @route   DELETE /api/v1/admin/banner-builder/:id
 * @access  Private/Admin
 */
const deleteBannerBuilder = async (req, res) => {
    try {
        const banner = await BannerBuilder.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        // Soft delete
        banner.status = 'expired';
        await banner.save();

        // Emit WebSocket event
        if (req.app.get('io')) {
            req.app.get('io').emit('banner:deleted', { id: req.params.id });
        }

        res.json({
            success: true,
            message: 'Banner deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting banner builder:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Hard delete banner builder
 * @route   DELETE /api/v1/admin/banner-builder/:id/permanent
 * @access  Private/Admin
 */
const hardDeleteBannerBuilder = async (req, res) => {
    try {
        const banner = await BannerBuilder.findByIdAndDelete(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        // Emit WebSocket event
        if (req.app.get('io')) {
            req.app.get('io').emit('banner:deleted', { id: req.params.id, permanent: true });
        }

        res.json({
            success: true,
            message: 'Banner permanently deleted'
        });
    } catch (error) {
        console.error('Error permanently deleting banner:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Duplicate banner builder
 * @route   POST /api/v1/admin/banner-builder/:id/duplicate
 * @access  Private/Admin
 */
const duplicateBannerBuilder = async (req, res) => {
    try {
        const originalBanner = await BannerBuilder.findById(req.params.id).lean();

        if (!originalBanner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        // Remove id and create copy
        delete originalBanner._id;
        delete originalBanner.createdAt;
        delete originalBanner.updatedAt;

        const duplicatedBanner = await BannerBuilder.create({
            ...originalBanner,
            name: `${originalBanner.name} (Copy)`,
            status: 'draft',
            version: 1,
            analytics: { impressions: 0, clicks: 0 },
            createdBy: req.user?._id || null
        });

        // Emit WebSocket event
        if (req.app.get('io')) {
            req.app.get('io').emit('banner:created', duplicatedBanner);
        }

        res.status(201).json({
            success: true,
            data: duplicatedBanner,
            message: 'Banner duplicated successfully'
        });
    } catch (error) {
        console.error('Error duplicating banner:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server Error'
        });
    }
};

/**
 * @desc    Update banner status (publish/unpublish)
 * @route   PATCH /api/v1/admin/banner-builder/:id/status
 * @access  Private/Admin
 */
const updateBannerStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['draft', 'active', 'scheduled', 'expired'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const banner = await BannerBuilder.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        // Emit WebSocket event
        if (req.app.get('io')) {
            req.app.get('io').emit('banner:statusChanged', {
                id: req.params.id,
                status,
                banner
            });
        }

        res.json({
            success: true,
            data: banner,
            message: `Banner ${status === 'active' ? 'published' : 'updated'} successfully`
        });
    } catch (error) {
        console.error('Error updating banner status:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get visible banners for frontend (Public)
 * @route   GET /api/v1/banner-builder/visible
 * @access  Public
 */
const getVisibleBanners = async (req, res) => {
    try {
        const banners = await BannerBuilder.findVisible().lean();

        res.json({
            success: true,
            data: banners,
            fetchedAt: new Date()
        });
    } catch (error) {
        console.error('Error fetching visible banners:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get single visible banner by ID (Public)
 * @route   GET /api/v1/banner-builder/:id/render
 * @access  Public
 */
const getBannerForRender = async (req, res) => {
    try {
        const banner = await BannerBuilder.findById(req.params.id).lean();

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        // Check visibility
        if (banner.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: 'Banner is not active'
            });
        }

        // Increment impressions
        await BannerBuilder.findByIdAndUpdate(req.params.id, {
            $inc: { 'analytics.impressions': 1 }
        });

        res.json({ success: true, data: banner });
    } catch (error) {
        console.error('Error fetching banner for render:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Track banner click (Public)
 * @route   POST /api/v1/banner-builder/:id/click
 * @access  Public
 */
const trackBannerClick = async (req, res) => {
    try {
        await BannerBuilder.findByIdAndUpdate(req.params.id, {
            $inc: { 'analytics.clicks': 1 }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error tracking banner click:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get default banner template
 * @route   GET /api/v1/admin/banner-builder/template
 * @access  Private/Admin
 */
const getDefaultTemplate = async (req, res) => {
    try {
        const defaultTemplate = {
            name: 'New Banner',
            status: 'draft',
            dimensions: {
                width: '100%',
                height: '500px',
                minHeight: '400px',
                maxHeight: '600px',
                aspectRatio: '21:9'
            },
            containerStyle: {
                backgroundColor: '#8e2de2',
                backgroundGradient: 'linear-gradient(135deg, #8e2de2, #4a00e0)',
                backgroundImage: '',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundBlendMode: 'normal',
                borderRadius: '12px',
                padding: '40px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                overflow: 'hidden'
            },
            layout: {
                splitRatio: '70:30',
                contentAlignment: 'left-to-right',
                verticalAlignment: 'center',
                gap: '20px'
            },
            content: {
                mainTitle: {
                    text: 'Shopping Center',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '64px',
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    lineHeight: '1.2',
                    textAlign: 'left',
                    letterSpacing: 'normal',
                    textTransform: 'none',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                },
                subTitle: {
                    text: 'PROMOTION FOR ALL STORE',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#FFD700',
                    border: '2px solid #FFD700',
                    padding: '8px 16px',
                    display: 'inline-block',
                    borderRadius: '4px',
                    backgroundColor: 'transparent'
                },
                description: {
                    text: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '16px',
                    fontWeight: 'normal',
                    color: '#E0E0E0',
                    lineHeight: '1.6'
                },
                saleBadge: {
                    text: '50% OFF',
                    bgColor: '#FFA500',
                    textColor: '#FFFFFF',
                    shape: 'rounded-triangle',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    position: { x: 50, y: 30, xUnit: '%', yUnit: '%' },
                    rotation: 15,
                    isVisible: true,
                    width: '120px',
                    height: 'auto',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                },
                productImage: {
                    url: '',
                    alt: 'Product Image',
                    position: 'bottom-right',
                    scale: 1.2,
                    overlapAmount: 50,
                    offsetX: 0,
                    offsetY: 0,
                    objectFit: 'contain'
                }
            },
            cta: {
                buttonText: 'Shop Now',
                link: '/',
                style: 'primary',
                bgColor: '#FF6B35',
                textColor: '#FFFFFF',
                borderColor: 'transparent',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                isVisible: true,
                hoverBgColor: '#FF8555'
            },
            decorativeElements: [
                {
                    type: 'circle',
                    color: 'rgba(0, 100, 200, 0.8)',
                    position: { x: 75, y: 50, xUnit: '%', yUnit: '%' },
                    width: '300px',
                    height: '300px',
                    rotation: 0,
                    opacity: 1,
                    zIndex: 1,
                    filled: true
                },
                {
                    type: 'blob',
                    color: 'rgba(255, 100, 150, 0.3)',
                    position: { x: 0, y: 0, xUnit: '%', yUnit: '%' },
                    width: '400px',
                    height: '300px',
                    rotation: 0,
                    opacity: 0.7,
                    zIndex: 0,
                    filled: true
                },
                {
                    type: 'triangle',
                    color: 'rgba(255, 255, 255, 0.3)',
                    position: { x: 85, y: 20, xUnit: '%', yUnit: '%' },
                    width: '60px',
                    height: '60px',
                    rotation: 0,
                    opacity: 0.5,
                    zIndex: 2,
                    filled: false,
                    borderWidth: '3px',
                    borderColor: 'rgba(255, 255, 255, 0.5)'
                }
            ],
            socialLinks: {
                isVisible: true,
                position: { x: 20, y: 20, xUnit: 'px', yUnit: 'px' },
                label: 'Follow our social networks',
                labelColor: '#FFFFFF',
                links: [
                    { platform: 'facebook', url: '#', iconColor: '#FFFFFF' },
                    { platform: 'instagram', url: '#', iconColor: '#FFFFFF' },
                    { platform: 'twitter', url: '#', iconColor: '#FFFFFF' },
                    { platform: 'youtube', url: '#', iconColor: '#FFFFFF' }
                ]
            },
            branding: {
                isVisible: true,
                logoUrl: '',
                logoText: 'Shopping Center',
                position: 'bottom-right',
                maxWidth: '150px'
            },
            googleFonts: ['Poppins'],
            responsive: {
                mobileBreakpoint: 768,
                mobileLayout: 'stack',
                mobileHeight: 'auto',
                mobilePadding: '20px',
                mobileTitleSize: '32px',
                mobileDescriptionSize: '14px'
            },
            seo: {
                altText: 'Shopping Center Promotional Banner',
                ariaLabel: 'Click to view promotions'
            }
        };

        res.json({ success: true, data: defaultTemplate });
    } catch (error) {
        console.error('Error getting default template:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getAllBannerBuilders,
    getBannerBuilderById,
    createBannerBuilder,
    updateBannerBuilder,
    deleteBannerBuilder,
    hardDeleteBannerBuilder,
    duplicateBannerBuilder,
    updateBannerStatus,
    getVisibleBanners,
    getBannerForRender,
    trackBannerClick,
    getDefaultTemplate
};
