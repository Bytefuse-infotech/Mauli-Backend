const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['order', 'system', 'promo', 'payment'],
        default: 'system'
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    is_read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for fetching user's notifications sorted by time
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
