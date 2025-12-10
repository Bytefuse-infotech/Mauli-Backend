const mongoose = require('mongoose');

const StoreAddressSchema = new mongoose.Schema({
    line1: { type: String, default: '' },
    line2: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    postal_code: { type: String, default: '' },
    country: { type: String, default: 'India' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null }
}, { _id: false });

const DeliveryFeeSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['flat', 'per_km'],
        default: 'flat'
    },
    base_fee: { type: Number, default: 0, min: 0 },
    rate: { type: Number, default: 0, min: 0 }, // per km rate
    advanced_rules: [
        {
            condition_type: String,
            value: mongoose.Schema.Types.Mixed
        }
    ]
}, { _id: false });

const CartDiscountSchema = new mongoose.Schema({
    discount_type: {
        type: String,
        enum: ['flat', 'percentage'],
        required: true
    },
    min_cart_value: { type: Number, required: true, min: 0 },
    value: { type: Number, required: true, min: 0 },
    max_discount_amount: { type: Number, default: null },
    priority: { type: Number, default: 0 }
}, { _id: false });

const SlotSchema = new mongoose.Schema({
    start_time: { type: String, required: true }, // "09:00"
    end_time: { type: String, required: true },   // "11:00"
    capacity: { type: Number, required: true, min: 1 },
    booked: { type: Number, default: 0, min: 0 }
}, { _id: false });

const DeliverySlotSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    slots: [SlotSchema]
}, { _id: false });

const StoreConfigSchema = new mongoose.Schema({
    store_address: {
        type: StoreAddressSchema,
        default: () => ({})
    },
    delivery_fee: {
        type: DeliveryFeeSchema,
        default: () => ({ type: 'flat', base_fee: 50, rate: 0 })
    },
    cart_discounts: {
        type: [CartDiscountSchema],
        default: []
    },
    delivery_slots: {
        type: [DeliverySlotSchema],
        default: []
    },
    is_delivery_enabled: {
        type: Boolean,
        default: true
    },
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true
});

// Index for tenant lookup
StoreConfigSchema.index({ tenant_id: 1 });

// Static method to get or create config
StoreConfigSchema.statics.getConfig = async function (tenant_id = null) {
    let config = await this.findOne({ tenant_id });

    if (!config) {
        // Create default config
        config = await this.create({
            tenant_id,
            store_address: {
                line1: '12 MG Road',
                city: 'Pune',
                state: 'Maharashtra',
                postal_code: '411001',
                country: 'India'
            },
            delivery_fee: {
                type: 'flat',
                base_fee: 50,
                rate: 0
            },
            cart_discounts: [
                {
                    discount_type: 'flat',
                    min_cart_value: 1000,
                    value: 100,
                    priority: 10
                }
            ],
            is_delivery_enabled: true
        });
    }

    return config;
};

module.exports = mongoose.model('StoreConfig', StoreConfigSchema);
