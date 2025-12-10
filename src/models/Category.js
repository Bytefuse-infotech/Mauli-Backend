const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a category name'],
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        index: true
    },
    priority: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    icon_url: {
        type: String,
        default: ''
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

// Indexes
categorySchema.index({ is_active: 1, priority: -1 });

// Helper to slugify
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

// Pre-save hook for slug generation
categorySchema.pre('save', async function (next) {
    if (!this.isModified('name') && !this.isNew && this.slug) {
        return next();
    }

    if (!this.slug || this.isModified('name')) {
        let baseSlug = this.slug || slugify(this.name);
        if (!baseSlug) baseSlug = 'category'; // Fallback

        // Check uniqueness
        let slug = baseSlug;
        let count = 1;

        // Loop to find unique slug
        // Note: In high concurrency this might race, but for categories (low frequency write) it is acceptable.
        // A robust solution handles duplicate key error, but loop is simpler for this scope.
        while (true) {
            const existing = await mongoose.models.Category.findOne({
                slug,
                _id: { $ne: this._id }
            });

            if (!existing) {
                break;
            }

            slug = `${baseSlug}-${count}`;
            count++;
        }

        this.slug = slug;
    }
    next();
});

// Static helper: findActive
categorySchema.statics.findActive = function () {
    return this.find({ is_active: true })
        .sort({ priority: -1, updatedAt: -1 });
};

module.exports = mongoose.model('Category', categorySchema);
