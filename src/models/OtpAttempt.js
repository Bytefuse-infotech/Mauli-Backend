const mongoose = require('mongoose');

const otpAttemptSchema = new mongoose.Schema({
    identifier: {
        type: String,
        required: true,
        index: true
    },
    identifier_type: {
        type: String,
        enum: ['phone', 'ip'],
        required: true
    },
    attempt_count: {
        type: Number,
        default: 1
    },
    first_attempt_at: {
        type: Date,
        default: Date.now
    },
    last_attempt_at: {
        type: Date,
        default: Date.now
    },
    cooldown_until: {
        type: Date,
        default: null
    },
    window_start: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for efficient lookups
otpAttemptSchema.index({ identifier: 1, identifier_type: 1 });
otpAttemptSchema.index({ cooldown_until: 1 });

// Clean up expired records (older than 24 hours) periodically
otpAttemptSchema.statics.cleanupOldRecords = async function() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.deleteMany({
        last_attempt_at: { $lt: twentyFourHoursAgo },
        cooldown_until: { $lt: new Date() }
    });
};

// Check if user/IP is in cooldown
otpAttemptSchema.statics.checkCooldown = async function(identifier, identifierType) {
    const record = await this.findOne({
        identifier,
        identifier_type: identifierType,
        cooldown_until: { $gt: new Date() }
    });

    if (record) {
        const remainingMinutes = Math.ceil((record.cooldown_until - new Date()) / (60 * 1000));
        return {
            inCooldown: true,
            remainingMinutes,
            cooldownUntil: record.cooldown_until
        };
    }

    return { inCooldown: false };
};

// Record an OTP attempt
otpAttemptSchema.statics.recordAttempt = async function(identifier, identifierType) {
    const TEN_MINUTES = 10 * 60 * 1000;
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const MAX_ATTEMPTS = 3;

    // Find existing record
    let record = await this.findOne({
        identifier,
        identifier_type: identifierType
    });

    const now = new Date();

    if (!record) {
        // Create new record
        record = await this.create({
            identifier,
            identifier_type: identifierType,
            attempt_count: 1,
            first_attempt_at: now,
            last_attempt_at: now,
            window_start: now
        });

        return {
            allowed: true,
            attemptsRemaining: MAX_ATTEMPTS - 1,
            resetTime: new Date(now.getTime() + TEN_MINUTES)
        };
    }

    // Check if in cooldown
    if (record.cooldown_until && record.cooldown_until > now) {
        const remainingMinutes = Math.ceil((record.cooldown_until - now) / (60 * 1000));
        return {
            allowed: false,
            reason: 'cooldown',
            remainingMinutes,
            cooldownUntil: record.cooldown_until
        };
    }

    // Check if window has expired (10 minutes)
    if (now - record.window_start > TEN_MINUTES) {
        // Reset the window
        record.attempt_count = 1;
        record.window_start = now;
        record.first_attempt_at = now;
        record.last_attempt_at = now;
        record.cooldown_until = null;
        await record.save();

        return {
            allowed: true,
            attemptsRemaining: MAX_ATTEMPTS - 1,
            resetTime: new Date(now.getTime() + TEN_MINUTES)
        };
    }

    // Within 10-minute window
    if (record.attempt_count >= MAX_ATTEMPTS) {
        // Set 2-hour cooldown
        record.cooldown_until = new Date(now.getTime() + TWO_HOURS);
        record.last_attempt_at = now;
        await record.save();

        return {
            allowed: false,
            reason: 'max_attempts',
            cooldownHours: 2,
            cooldownUntil: record.cooldown_until
        };
    }

    // Allow attempt and increment counter
    record.attempt_count += 1;
    record.last_attempt_at = now;
    await record.save();

    return {
        allowed: true,
        attemptsRemaining: MAX_ATTEMPTS - record.attempt_count,
        resetTime: new Date(record.window_start.getTime() + TEN_MINUTES)
    };
};

// Get attempt status without recording
otpAttemptSchema.statics.getAttemptStatus = async function(identifier, identifierType) {
    const MAX_ATTEMPTS = 3;
    const TEN_MINUTES = 10 * 60 * 1000;

    const record = await this.findOne({
        identifier,
        identifier_type: identifierType
    });

    if (!record) {
        return {
            attemptsUsed: 0,
            attemptsRemaining: MAX_ATTEMPTS,
            inCooldown: false
        };
    }

    const now = new Date();

    // Check if in cooldown
    if (record.cooldown_until && record.cooldown_until > now) {
        const remainingMinutes = Math.ceil((record.cooldown_until - now) / (60 * 1000));
        return {
            attemptsUsed: record.attempt_count,
            attemptsRemaining: 0,
            inCooldown: true,
            cooldownRemainingMinutes: remainingMinutes,
            cooldownUntil: record.cooldown_until
        };
    }

    // Check if window has expired
    if (now - record.window_start > TEN_MINUTES) {
        return {
            attemptsUsed: 0,
            attemptsRemaining: MAX_ATTEMPTS,
            inCooldown: false
        };
    }

    return {
        attemptsUsed: record.attempt_count,
        attemptsRemaining: Math.max(0, MAX_ATTEMPTS - record.attempt_count),
        inCooldown: false,
        windowExpiresAt: new Date(record.window_start.getTime() + TEN_MINUTES)
    };
};

module.exports = mongoose.model('OtpAttempt', otpAttemptSchema);