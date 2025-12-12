const mongoose = require('mongoose');

const appContentSchema = new mongoose.Schema({
    key: {
        type: String, // e.g., 'about_us', 'refund_policy', 'terms'
        required: true,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    is_visible: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AppContent', appContentSchema);
