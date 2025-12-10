const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unit: {
        type: String,
        enum: ['box', 'dozen'],
        required: true
    },
    price_at_add: {
        type: Number,
        required: true,
        min: 0
    },
    discount_at_add: {
        type: Number,
        default: 0,
        min: 0
    }
}, { _id: false });

const CartSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: {
        type: [CartItemSchema],
        default: []
    },
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    }
}, {
    timestamps: true
});

// Index for quick user lookup
CartSchema.index({ user_id: 1 });

// Method to calculate cart totals
CartSchema.methods.calculateTotals = function () {
    let subtotal = 0;

    this.items.forEach(item => {
        const itemPrice = item.price_at_add - item.discount_at_add;
        subtotal += itemPrice * item.quantity;
    });

    return {
        subtotal,
        item_count: this.items.reduce((sum, item) => sum + item.quantity, 0)
    };
};

// Static method to get or create cart
CartSchema.statics.getOrCreateCart = async function (user_id) {
    let cart = await this.findOne({ user_id });

    if (!cart) {
        cart = await this.create({ user_id, items: [] });
    }

    return cart;
};

module.exports = mongoose.model('Cart', CartSchema);
