const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    label: {
        type: String,
        enum: ['home', 'work', 'other'],
        default: 'home'
    },
    name: {
        type: String,
        required: [true, 'Contact name is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    address_line1: {
        type: String,
        required: [true, 'Address line 1 is required'],
        trim: true
    },
    address_line2: {
        type: String,
        trim: true
    },
    landmark: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
    },
    postal_code: {
        type: String,
        required: [true, 'Postal code is required'],
        trim: true
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        default: 'India',
        trim: true
    },
    latitude: {
        type: Number,
        min: -90,
        max: 90
    },
    longitude: {
        type: Number,
        min: -180,
        max: 180
    },
    is_default: {
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for user and default address
addressSchema.index({ user_id: 1, is_default: 1 });
addressSchema.index({ user_id: 1, is_active: 1 });

// Pre-save middleware to ensure only one default address per user
addressSchema.pre('save', async function (next) {
    if (this.is_default && this.isModified('is_default')) {
        // Remove default flag from other addresses of this user
        await this.constructor.updateMany(
            {
                user_id: this.user_id,
                _id: { $ne: this._id },
                is_default: true
            },
            { $set: { is_default: false } }
        );
    }
    next();
});

// Static method to get user's default address
addressSchema.statics.getDefaultAddress = async function (userId) {
    return await this.findOne({
        user_id: userId,
        is_default: true,
        is_active: true
    });
};

// Static method to get all active addresses for a user
addressSchema.statics.getUserAddresses = async function (userId) {
    return await this.find({
        user_id: userId,
        is_active: true
    }).sort({ is_default: -1, createdAt: -1 });
};

module.exports = mongoose.model('Address', addressSchema);
