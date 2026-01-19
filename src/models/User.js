const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    phone: {
        type: String,
        // Phone is now optional - users can add it later from profile
        index: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ],
        index: true
    },
    password_hash: {
        type: String,
        // Password is now optional - using OTP-based authentication
        // required: [true, 'Please add a password'],
        select: false // Don't return password by default
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'customer'],
        default: 'customer',
        index: 1
    },
    is_active: {
        type: Boolean,
        default: true,
        index: 1
    },
    address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        postal_code: String,
        country: String
    },
    last_login_at: {
        type: Date,
        index: -1
    },
    last_logout_at: {
        type: Date
    },
    total_time_spent_seconds: {
        type: Number,
        default: 0
    },
    last_session_duration_seconds: {
        type: Number,
        default: 0
    },
    successful_sessions_count: {
        type: Number,
        default: 0
    },
    total_orders_count: {
        type: Number,
        default: 0
    },
    last_ip: {
        type: String
    },
    is_email_verified: {
        type: Boolean,
        default: false
    },
    is_phone_verified: {
        type: Boolean,
        default: false
    },
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        // ref: 'Tenant', // Future proofing
        index: 1
    },
    meta: {
        type: Map,
        of: String
        // Flexible key-value pairs
    },
    otp_hash: {
        type: String,
        select: false
    },
    otp_expires_at: {
        type: Date
    },
    // Firebase Auth user ID for phone OTP authentication
    firebase_uid: {
        type: String,
        index: true,
        sparse: true
    },
    // FCM tokens for push notifications (multiple devices per user)
    fcm_tokens: [{
        token: {
            type: String,
            required: true
        },
        device_info: {
            type: String // Optional: browser/device identifier
        },
        created_at: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Indexes
// Removed duplicate indexes as they are defined in schema options
// userSchema.index({ role: 1, is_active: 1 });
// userSchema.index({ tenant_id: 1, is_active: 1 });

// Instance Methods

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password_hash) return false;
    return await bcrypt.compare(enteredPassword, this.password_hash);
};

// Record Login
userSchema.methods.recordLogin = async function ({ ip }) {
    this.last_login_at = new Date();
    this.last_ip = ip;
    return this.save();
};

// Record Logout
userSchema.methods.recordLogout = async function ({ sessionDurationSeconds, hadOrder }) {
    this.last_logout_at = new Date();
    this.last_session_duration_seconds = sessionDurationSeconds || 0;
    this.total_time_spent_seconds = (this.total_time_spent_seconds || 0) + (sessionDurationSeconds || 0);

    if (hadOrder) {
        this.successful_sessions_count = (this.successful_sessions_count || 0) + 1;
    }

    return this.save();
};

// Static Methods

// Dashboard Stats
userSchema.statics.dashboardStats = async function ({ tenant_id }) {
    const matchStage = {};
    if (tenant_id) {
        matchStage.tenant_id = new mongoose.Types.ObjectId(tenant_id);
    }

    // "Today" defined as strictly current day 00:00 UTC to now? Or last 24h?
    // Usually "Today" implies start of Day.
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $facet: {
                totalUsers: [{ $count: "count" }],
                activeUsers: [{ $match: { is_active: true } }, { $count: "count" }],
                todayLoggedIn: [
                    { $match: { last_login_at: { $gte: startOfDay } } },
                    { $count: "count" }
                ],
                byRole: [
                    { $group: { _id: "$role", count: { $sum: 1 } } }
                ]
            }
        }
    ]);

    // Format output
    const data = stats[0];
    const result = {
        totalUsers: data.totalUsers[0] ? data.totalUsers[0].count : 0,
        activeUsers: data.activeUsers[0] ? data.activeUsers[0].count : 0,
        todayLoggedIn: data.todayLoggedIn[0] ? data.todayLoggedIn[0].count : 0,
        byRole: {}
    };

    data.byRole.forEach(roleGroup => {
        result.byRole[roleGroup._id] = roleGroup.count;
    });

    return result;
};

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password_hash')) {
        next();
    }

    // Note: If we are modifying helper methods that set 'password_hash' directly from a plain password field, 
    // we would handle the hashing logic there.
    // However, usually we set the `password_hash` directly in controller or have a virtual `password`.
    // The requirement says "store hashed only" and "Server must hash passwords".
    // I will implementation hashing here if the field is technically modified, 
    // BUT usually it's cleaner to have a 'password' virtual or handle it explicitly.
    // Let's assume the controller sets `password_hash` or we use a helper.
    // WAIT: Common practice with Mongoose is `user.password = 'plain'` and pre-save hashes it.
    // But the schema defines `password_hash`. 
    // Let's assume the usage is: user.password_hash = await bcrypt.hash(plain, salt);
    // So no pre-save hook is strictly needed for hashing if we enforce it in service/controller.
    // I will stick to explicit hashing in Service/Controller for clarity as per modern practices 
    // vs magic hooks, unless requested. The prompt says "Server must hash passwords".
    next();
});

module.exports = mongoose.model('User', userSchema);
