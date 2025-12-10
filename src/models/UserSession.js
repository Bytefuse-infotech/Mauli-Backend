const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    start_at: {
        type: Date,
        default: Date.now,
        required: true,
        index: -1 // Useful for finding most recent sessions
    },
    end_at: {
        type: Date
    },
    duration_seconds: {
        type: Number,
        default: 0
    },
    had_order: {
        type: Boolean,
        default: false
    },
    order_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    device: String,
    ip: String,
    user_agent: String
}, {
    timestamps: true
});

// Index for efficient history layout
userSessionSchema.index({ user_id: 1, start_at: -1 });

module.exports = mongoose.model('UserSession', userSessionSchema);
