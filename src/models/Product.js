const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    order_index: { type: Number, default: 0 }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [256, 'Product name cannot exceed 256 characters']
    },
    mrp: {
        type: Number,
        required: [true, 'MRP is required'],
        min: [0, 'MRP cannot be negative']
    },
    price: {
        type: Number,
        required: [true, 'Selling price is required'],
        min: [0, 'Selling price cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative']
    },
    unit: {
        type: String,
        enum: {
            values: ['box', 'dozen', 'both'],
            message: 'Unit must be either box, dozen, or both'
        },
        required: [true, 'Unit is required']
    },
    description: {
        type: String,
        default: '',
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    images: {
        type: [ImageSchema],
        default: []
    },
    is_active: {
        type: Boolean,
        default: true
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    }
}, {
    timestamps: true
});

// Pre-save hook to auto-calculate discount from MRP and price
ProductSchema.pre('save', function (next) {
    // Calculate discount as MRP - selling price
    if (this.mrp && this.price) {
        this.discount = Math.max(0, this.mrp - this.price);
    }
    next();
});

// Pre-update hook for findOneAndUpdate operations
ProductSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update.mrp !== undefined && update.price !== undefined) {
        update.discount = Math.max(0, update.mrp - update.price);
    } else if (update.$set && update.$set.mrp !== undefined && update.$set.price !== undefined) {
        update.$set.discount = Math.max(0, update.$set.mrp - update.$set.price);
    }
    next();
});

// Indexes for efficient queries
ProductSchema.index({ is_active: 1, createdAt: -1 });
ProductSchema.index({ category_id: 1, is_active: 1 });
ProductSchema.index({ name: 'text', description: 'text' }); // Text search

module.exports = mongoose.model('Product', ProductSchema);
