const OtpAttempt = require('../models/OtpAttempt');

/**
 * Rate limiting middleware for OTP requests
 * Rules:
 * - 3 attempts maximum in 10-minute window
 * - 2-hour cooldown after exceeding limit
 * - Tracks both phone number and IP address
 */
const otpRateLimit = async (req, res, next) => {
    try {
        const { phone } = req.body;
        const ip = req.ip || req.connection.remoteAddress || 'unknown';

        // Clean IP address (remove IPv6 prefix if present)
        const cleanIp = ip.replace(/^::ffff:/, '');

        // Check rate limiting for both phone and IP
        const phoneCheck = phone ? await OtpAttempt.recordAttempt(phone, 'phone') : { allowed: true };
        const ipCheck = await OtpAttempt.recordAttempt(cleanIp, 'ip');

        // If either phone or IP is blocked, deny the request
        if (!phoneCheck.allowed) {
            const message = phoneCheck.reason === 'cooldown'
                ? `Too many OTP requests. Please wait ${phoneCheck.remainingMinutes} minutes before trying again.`
                : `Maximum OTP attempts (3) reached. Please wait 2 hours before trying again.`;

            return res.status(429).json({
                success: false,
                message,
                error_code: 'RATE_LIMIT_EXCEEDED',
                cooldown_until: phoneCheck.cooldownUntil,
                remaining_minutes: phoneCheck.remainingMinutes || 120
            });
        }

        if (!ipCheck.allowed) {
            const message = ipCheck.reason === 'cooldown'
                ? `Too many OTP requests from this network. Please wait ${ipCheck.remainingMinutes} minutes.`
                : `Maximum OTP attempts from this network. Please wait 2 hours before trying again.`;

            return res.status(429).json({
                success: false,
                message,
                error_code: 'RATE_LIMIT_EXCEEDED',
                cooldown_until: ipCheck.cooldownUntil,
                remaining_minutes: ipCheck.remainingMinutes || 120
            });
        }

        // Add rate limit info to response headers
        res.setHeader('X-RateLimit-Limit', '3');
        res.setHeader('X-RateLimit-Remaining-Phone', phoneCheck.attemptsRemaining || 0);
        res.setHeader('X-RateLimit-Remaining-IP', ipCheck.attemptsRemaining || 0);

        if (phoneCheck.resetTime) {
            res.setHeader('X-RateLimit-Reset', new Date(phoneCheck.resetTime).toISOString());
        }

        // Store rate limit info in request for use in controller
        req.rateLimitInfo = {
            phone: {
                attemptsRemaining: phoneCheck.attemptsRemaining,
                resetTime: phoneCheck.resetTime
            },
            ip: {
                attemptsRemaining: ipCheck.attemptsRemaining,
                resetTime: ipCheck.resetTime
            }
        };

        next();
    } catch (error) {
        console.error('Rate limit middleware error:', error);
        // Don't block the request if rate limiting fails
        next();
    }
};

/**
 * Check rate limit status without recording an attempt
 * Useful for showing remaining attempts in UI
 */
const checkOtpRateLimit = async (req, res, next) => {
    try {
        const { phone } = req.query || req.body;
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const cleanIp = ip.replace(/^::ffff:/, '');

        const phoneStatus = phone ? await OtpAttempt.getAttemptStatus(phone, 'phone') : null;
        const ipStatus = await OtpAttempt.getAttemptStatus(cleanIp, 'ip');

        res.json({
            success: true,
            phone: phoneStatus,
            ip: ipStatus
        });
    } catch (error) {
        console.error('Rate limit check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check rate limit status'
        });
    }
};

/**
 * Cleanup old OTP attempt records
 * Run this periodically (e.g., daily) via cron job
 */
const cleanupOtpAttempts = async () => {
    try {
        await OtpAttempt.cleanupOldRecords();
        console.log('OTP attempt records cleanup completed');
    } catch (error) {
        console.error('OTP cleanup error:', error);
    }
};

// Run cleanup on server start and every 24 hours
cleanupOtpAttempts();
setInterval(cleanupOtpAttempts, 24 * 60 * 60 * 1000);

module.exports = {
    otpRateLimit,
    checkOtpRateLimit,
    cleanupOtpAttempts
};