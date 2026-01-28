const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    // Banner source type: 'builder', 'upload', or 'url'
    source_type: {
        type: String,
        enum: ['builder', 'upload', 'url'],
        default: 'upload'
    },
    // For uploaded or external URL banners
    image_url: {
        type: String,
        required: function() {
            return this.source_type === 'upload' || this.source_type === 'url';
        }
    },
    // For banner builder banners (reference to BannerBuilder model)
    banner_builder_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BannerBuilder',
        required: function() {
            return this.source_type === 'builder';
        }
    },
    // Cloudinary public_id for uploaded images (for deletion)
    cloudinary_public_id: {
        type: String
    },
    title: {
        type: String,
        maxlength: [120, 'Title cannot be more than 120 characters']
    },
    subtitle: {
        type: String,
        maxlength: [200, 'Subtitle cannot be more than 200 characters']
    },
    offer_text: {
        type: String,
        maxlength: [50, 'Offer text cannot be more than 50 characters']
    },
    percentage_off: {
        type: Number,
        min: 0,
        max: 100
    },
    amount_off: {
        type: Number,
        min: 0
    },
    target_url: {
        type: String,
        default: '/'
    },
    start_at: {
        type: Date
    },
    end_at: {
        type: Date
    },
    priority: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        // ref: 'Tenant', 
        default: null
    },
    meta: {
        type: Map,
        of: String,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for public query performance
bannerSchema.index({ is_active: 1, priority: -1, start_at: 1, end_at: 1 });

// Instance Method: Check if visibility conditions are met
bannerSchema.methods.isCurrentlyVisible = function () {
    if (!this.is_active) return false;

    const now = new Date();
    if (this.start_at && now < this.start_at) return false;
    if (this.end_at && now > this.end_at) return false;

    return true;
};

// Static Method: Find visible banners
bannerSchema.statics.findVisible = function (now = new Date()) {
    return this.find({
        is_active: true,
        $or: [
            { start_at: { $exists: false } },
            { start_at: null },
            { start_at: { $lte: now } }
        ],
        $and: [
            {
                $or: [
                    { end_at: { $exists: false } },
                    { end_at: null },
                    { end_at: { $gte: now } }
                ]
            }
        ]
    })
        .sort({ priority: -1, createdAt: -1 }); // Sort by priority desc, then newest
};

module.exports = mongoose.model('Banner', bannerSchema);
