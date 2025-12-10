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
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
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

// Indexes for efficient queries
ProductSchema.index({ is_active: 1, createdAt: -1 });
ProductSchema.index({ category_id: 1, is_active: 1 });
ProductSchema.index({ name: 'text', description: 'text' }); // Text search

module.exports = mongoose.model('Product', ProductSchema);
