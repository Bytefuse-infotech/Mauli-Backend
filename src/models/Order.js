const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    product_name: {
        type: String,
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
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const DeliveryAddressSchema = new mongoose.Schema({
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postal_code: { type: String, required: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    order_number: {
        type: String,
        unique: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: {
        type: [OrderItemSchema],
        required: true,
        validate: {
            validator: function (items) {
                return items && items.length > 0;
            },
            message: 'Order must have at least one item'
        }
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    delivery_fee: {
        type: Number,
        required: true,
        min: 0
    },
    discount_amount: {
        type: Number,
        default: 0,
        min: 0
    },
    total_amount: {
        type: Number,
        required: true,
        min: 0
    },
    delivery_address: {
        type: DeliveryAddressSchema,
        required: true
    },
    delivery_slot: {
        date: { type: Date, required: false },
        start_time: { type: String, required: false },
        end_time: { type: String, required: false }
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending'
    },
    payment_status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    payment_method: {
        type: String,
        enum: ['cod', 'online', 'upi'],
        default: 'cod'
    },
    notes: {
        type: String,
        default: ''
    },
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    }
}, {
    timestamps: true
});

// Indexes
OrderSchema.index({ user_id: 1, createdAt: -1 });
// OrderSchema.index({ order_number: 1 }); // Duplicate
OrderSchema.index({ status: 1 });

// Pre-save hook to generate order number
OrderSchema.pre('save', async function (next) {
    if (this.isNew && !this.order_number) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.order_number = `ORD${timestamp}${random}`;
    }
    next();
});

module.exports = mongoose.model('Order', OrderSchema);
