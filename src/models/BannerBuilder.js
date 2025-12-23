const mongoose = require('mongoose');

/**
 * Typography Schema - Controls font properties for text elements
 */
const typographySchema = new mongoose.Schema({
    text: { type: String, default: '' },
    fontFamily: { type: String, default: 'Poppins, sans-serif' },
    fontSize: { type: String, default: '16px' },
    fontWeight: { type: String, default: 'normal' },
    color: { type: String, default: '#FFFFFF' },
    lineHeight: { type: String, default: '1.5' },
    textAlign: { type: String, default: 'left' },
    letterSpacing: { type: String, default: 'normal' },
    textTransform: { type: String, default: 'none' },
    textShadow: { type: String, default: 'none' },
    // Border/Badge specific
    border: { type: String, default: 'none' },
    borderRadius: { type: String, default: '0px' },
    padding: { type: String, default: '0px' },
    backgroundColor: { type: String, default: 'transparent' },
    display: { type: String, default: 'block' }
}, { _id: false });

/**
 * Position Schema - Controls X/Y positioning for floating elements
 */
const positionSchema = new mongoose.Schema({
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    xUnit: { type: String, enum: ['px', '%'], default: 'px' },
    yUnit: { type: String, enum: ['px', '%'], default: 'px' }
}, { _id: false });

/**
 * Sale Badge Schema - Floating promotional badge
 */
const saleBadgeSchema = new mongoose.Schema({
    text: { type: String, default: '50% OFF' },
    bgColor: { type: String, default: '#FFA500' },
    textColor: { type: String, default: '#FFFFFF' },
    shape: {
        type: String,
        enum: ['circle', 'rounded', 'triangle', 'rounded-triangle', 'pill'],
        default: 'rounded-triangle'
    },
    fontSize: { type: String, default: '24px' },
    fontWeight: { type: String, default: 'bold' },
    position: { type: positionSchema, default: () => ({}) },
    rotation: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    width: { type: String, default: '120px' },
    height: { type: String, default: 'auto' },
    boxShadow: { type: String, default: '0 4px 15px rgba(0,0,0,0.2)' }
}, { _id: false });

/**
 * Product Image Schema - Right side image with overlap settings
 */
const productImageSchema = new mongoose.Schema({
    url: { type: String, default: '' },
    alt: { type: String, default: 'Product Image' },
    position: {
        type: String,
        enum: ['center', 'bottom-right', 'bottom-center', 'center-right'],
        default: 'bottom-right'
    },
    scale: { type: Number, default: 1.0, min: 0.1, max: 3.0 },
    overlapAmount: { type: Number, default: 0 }, // Pixels to bleed outside container
    offsetX: { type: Number, default: 0 },
    offsetY: { type: Number, default: 0 },
    objectFit: { type: String, enum: ['contain', 'cover', 'fill', 'none'], default: 'contain' }
}, { _id: false });

/**
 * CTA Button Schema - Call to action button
 */
const ctaSchema = new mongoose.Schema({
    buttonText: { type: String, default: 'Shop Now' },
    link: { type: String, default: '/' },
    style: {
        type: String,
        enum: ['primary', 'secondary', 'outline', 'ghost'],
        default: 'primary'
    },
    bgColor: { type: String, default: '#FF6B35' },
    textColor: { type: String, default: '#FFFFFF' },
    borderColor: { type: String, default: 'transparent' },
    borderRadius: { type: String, default: '8px' },
    padding: { type: String, default: '12px 24px' },
    fontSize: { type: String, default: '16px' },
    fontWeight: { type: String, default: '600' },
    isVisible: { type: Boolean, default: true },
    hoverBgColor: { type: String, default: '#FF8555' }
}, { _id: false });

/**
 * Decorative Element Schema - Blobs, dots, circles, triangles
 */
const decorativeElementSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['blob', 'circle', 'dots', 'triangle', 'line', 'wave'],
        required: true
    },
    color: { type: String, default: 'rgba(255,255,255,0.1)' },
    position: { type: positionSchema, default: () => ({}) },
    width: { type: String, default: '100px' },
    height: { type: String, default: '100px' },
    rotation: { type: Number, default: 0 },
    opacity: { type: Number, default: 1, min: 0, max: 1 },
    zIndex: { type: Number, default: 1 },
    borderWidth: { type: String, default: '2px' },
    borderColor: { type: String, default: 'transparent' },
    filled: { type: Boolean, default: true }
}, { _id: false });

/**
 * Social Links Schema
 */
const socialLinksSchema = new mongoose.Schema({
    isVisible: { type: Boolean, default: false },
    position: { type: positionSchema, default: () => ({ x: 20, y: 20 }) },
    label: { type: String, default: 'Follow our social networks' },
    labelColor: { type: String, default: '#FFFFFF' },
    links: [{
        platform: {
            type: String,
            enum: ['facebook', 'instagram', 'twitter', 'youtube', 'linkedin', 'tiktok']
        },
        url: { type: String },
        iconColor: { type: String, default: '#FFFFFF' }
    }]
}, { _id: false });

/**
 * Logo/Branding Schema
 */
const brandingSchema = new mongoose.Schema({
    isVisible: { type: Boolean, default: false },
    logoUrl: { type: String, default: '' },
    logoText: { type: String, default: '' },
    position: {
        type: String,
        enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        default: 'bottom-right'
    },
    maxWidth: { type: String, default: '150px' }
}, { _id: false });

/**
 * Main Banner Builder Schema
 */
const bannerBuilderSchema = new mongoose.Schema({
    // Identification
    name: {
        type: String,
        required: [true, 'Banner name is required'],
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'scheduled', 'expired'],
        default: 'draft'
    },

    // Container Dimensions
    dimensions: {
        width: { type: String, default: '100%' },
        height: { type: String, default: '500px' },
        minHeight: { type: String, default: '400px' },
        maxHeight: { type: String, default: '600px' },
        aspectRatio: { type: String, default: '21:9' }
    },

    // Container Styling
    containerStyle: {
        backgroundColor: { type: String, default: '#8e2de2' },
        backgroundGradient: {
            type: String,
            default: 'linear-gradient(135deg, #8e2de2, #4a00e0)'
        },
        backgroundImage: { type: String, default: '' },
        backgroundSize: { type: String, default: 'cover' },
        backgroundPosition: { type: String, default: 'center' },
        backgroundRepeat: { type: String, default: 'no-repeat' },
        backgroundBlendMode: { type: String, default: 'normal' },
        borderRadius: { type: String, default: '12px' },
        padding: { type: String, default: '40px' },
        boxShadow: { type: String, default: '0 10px 40px rgba(0,0,0,0.2)' },
        overflow: { type: String, default: 'hidden' }
    },

    // Layout Configuration
    layout: {
        splitRatio: { type: String, default: '70:30' },
        contentAlignment: {
            type: String,
            enum: ['left-to-right', 'right-to-left'],
            default: 'left-to-right'
        },
        verticalAlignment: {
            type: String,
            enum: ['top', 'center', 'bottom'],
            default: 'center'
        },
        gap: { type: String, default: '20px' }
    },

    // Content Elements
    content: {
        mainTitle: {
            type: typographySchema, default: () => ({
                text: 'Shopping Center',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '64px',
                fontWeight: 'bold',
                color: '#FFFFFF',
                lineHeight: '1.2'
            })
        },
        subTitle: {
            type: typographySchema, default: () => ({
                text: 'PROMOTION FOR ALL STORE',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '18px',
                fontWeight: '600',
                color: '#FFD700',
                border: '2px solid #FFD700',
                padding: '8px 16px',
                display: 'inline-block',
                borderRadius: '4px'
            })
        },
        description: {
            type: typographySchema, default: () => ({
                text: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt.',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '16px',
                fontWeight: 'normal',
                color: '#E0E0E0',
                lineHeight: '1.6'
            })
        },
        saleBadge: { type: saleBadgeSchema, default: () => ({}) },
        productImage: { type: productImageSchema, default: () => ({}) }
    },

    // Call to Action
    cta: { type: ctaSchema, default: () => ({}) },

    // Decorative Elements
    decorativeElements: [decorativeElementSchema],

    // Social Links
    socialLinks: { type: socialLinksSchema, default: () => ({}) },

    // Branding
    branding: { type: brandingSchema, default: () => ({}) },

    // Google Fonts used
    googleFonts: [{ type: String }],

    // Scheduling
    startAt: { type: Date },
    endAt: { type: Date },

    // Priority (higher = more important)
    priority: { type: Number, default: 0 },

    // Target URL when banner is clicked
    targetUrl: { type: String, default: '/' },

    // Responsive Settings
    responsive: {
        mobileBreakpoint: { type: Number, default: 768 },
        mobileLayout: {
            type: String,
            enum: ['stack', 'background-image', 'hide-image'],
            default: 'stack'
        },
        mobileHeight: { type: String, default: 'auto' },
        mobilePadding: { type: String, default: '20px' },
        mobileTitleSize: { type: String, default: '32px' },
        mobileDescriptionSize: { type: String, default: '14px' }
    },

    // SEO
    seo: {
        altText: { type: String, default: '' },
        ariaLabel: { type: String, default: '' }
    },

    // Analytics
    analytics: {
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 }
    },

    // Version tracking for undo/redo
    version: { type: Number, default: 1 },

    // Created by
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Indexes
bannerBuilderSchema.index({ status: 1, priority: -1, startAt: 1, endAt: 1 });
bannerBuilderSchema.index({ name: 'text' });

// Instance Method: Check if banner is currently visible
bannerBuilderSchema.methods.isCurrentlyVisible = function () {
    if (this.status !== 'active') return false;

    const now = new Date();
    if (this.startAt && now < this.startAt) return false;
    if (this.endAt && now > this.endAt) return false;

    return true;
};

// Static Method: Find visible banners
bannerBuilderSchema.statics.findVisible = function (now = new Date()) {
    return this.find({
        status: 'active',
        $or: [
            { startAt: { $exists: false } },
            { startAt: null },
            { startAt: { $lte: now } }
        ],
        $and: [{
            $or: [
                { endAt: { $exists: false } },
                { endAt: null },
                { endAt: { $gte: now } }
            ]
        }]
    }).sort({ priority: -1, createdAt: -1 });
};

// Pre-save hook to extract Google Fonts
bannerBuilderSchema.pre('save', function (next) {
    const fonts = new Set();

    const extractFont = (fontFamily) => {
        if (fontFamily && !fontFamily.includes('sans-serif') && !fontFamily.includes('serif')) {
            const font = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
            if (font) fonts.add(font);
        }
    };

    if (this.content?.mainTitle?.fontFamily) extractFont(this.content.mainTitle.fontFamily);
    if (this.content?.subTitle?.fontFamily) extractFont(this.content.subTitle.fontFamily);
    if (this.content?.description?.fontFamily) extractFont(this.content.description.fontFamily);

    this.googleFonts = Array.from(fonts);
    next();
});

module.exports = mongoose.model('BannerBuilder', bannerBuilderSchema);
