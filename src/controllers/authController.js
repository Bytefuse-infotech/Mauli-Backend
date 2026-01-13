const User = require('../models/User');
const UserSession = require('../models/UserSession');
const authService = require('../services/authService');
const sendOtp = require('../utils/sendOtp');

// @desc    Request OTP for login/signup
// @route   POST /api/v1/auth/request-otp
// @access  Public
const requestOtp = async (req, res) => {
    try {
        const { phone, name, email } = req.body;

        if (!phone) {
            return res.status(400).json({ message: 'Please provide phone number' });
        }

        // Generate OTP
        const otp = authService.generateOtp();
        const otp_hash = await authService.hashPassword(otp);
        const otp_expires_at = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

        // Check if user exists
        let user = await User.findOne({ phone });

        if (!user) {
            // New user - create account with minimal info
            // Name and email are optional at this stage
            user = await User.create({
                phone,
                name: name || 'User',
                email: email || `${phone}@temp.com`, // Temporary email if not provided
                role: 'customer',
                is_active: false, // Will be activated after OTP verification
                otp_hash,
                otp_expires_at
            });
        } else {
            // Existing user - just update OTP
            user.otp_hash = otp_hash;
            user.otp_expires_at = otp_expires_at;

            // Update name and email if provided and user is not yet verified
            if (!user.is_active) {
                if (name) user.name = name;
                if (email) user.email = email;
            }

            await user.save();
        }

        // Send OTP
        await sendOtp(phone, otp, 'phone');

        res.status(200).json({
            success: true,
            message: `OTP sent to ${phone}`,
            isNewUser: !user.is_active,
            otp_expires_in_seconds: 120, // 2 minutes
            // Rate limit info from middleware
            rate_limit: req.rateLimitInfo,
            // In dev mode, send OTP in response for testing
            dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Verify OTP and login
// @route   POST /api/v1/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
    try {
        const { phone, otp, name, email } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ message: 'Please provide phone and OTP' });
        }

        const user = await User.findOne({ phone }).select('+otp_hash');

        if (!user) {
            return res.status(404).json({ message: 'User not found. Please request OTP first.' });
        }

        if (!user.otp_hash || !user.otp_expires_at) {
            return res.status(400).json({ message: 'No OTP request found. Please request a new OTP.' });
        }

        if (user.otp_expires_at < new Date()) {
            return res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
        }

        const isMatch = await authService.comparePassword(otp, user.otp_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // If this is first time login (signup), update user details if provided
        if (!user.is_active) {
            user.is_active = true;
            user.is_phone_verified = true;

            // Update name and email if provided during verification
            if (name && name !== 'User') {
                user.name = name;
            }
            if (email && !email.includes('@temp.com')) {
                user.email = email;
            }
        }

        // Clear OTP
        user.otp_hash = undefined;
        user.otp_expires_at = undefined;
        await user.save();

        // Record Login
        const ip = req.ip || req.connection.remoteAddress;
        await user.recordLogin({ ip });

        // Create Session
        const session = await UserSession.create({
            user_id: user._id,
            start_at: new Date(),
            ip: ip,
            user_agent: req.headers['user-agent'],
        });

        // Generate Tokens
        const accessToken = authService.generateAccessToken(user);
        const refreshToken = authService.generateRefreshToken(user);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                is_phone_verified: user.is_phone_verified
            },
            sessionId: session._id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Resend OTP
// @route   POST /api/v1/auth/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ message: 'Please provide phone number' });
        }

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found. Please request OTP first.' });
        }

        // Generate new OTP
        const otp = authService.generateOtp();
        const otp_hash = await authService.hashPassword(otp);
        const otp_expires_at = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

        user.otp_hash = otp_hash;
        user.otp_expires_at = otp_expires_at;
        await user.save();

        // Send OTP
        await sendOtp(phone, otp, 'phone');

        res.status(200).json({
            success: true,
            message: `OTP resent to ${phone}`,
            otp_expires_in_seconds: 120, // 2 minutes
            // Rate limit info from middleware
            rate_limit: req.rateLimitInfo,
            // In dev mode, send OTP in response for testing
            dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { name, email, address } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields if provided
        if (name) user.name = name;
        if (email) user.email = email;
        if (address) user.address = address;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                address: user.address,
                is_phone_verified: user.is_phone_verified
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user profile
// @route   GET /api/v1/auth/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-otp_hash -otp_expires_at');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = async (req, res) => {
    try {
        const { sessionId, hadOrder } = req.body;
        const userId = req.user._id;

        if (sessionId) {
            const session = await UserSession.findOne({ _id: sessionId, user_id: userId });

            if (session) {
                const endAt = new Date();
                const duration = Math.round((endAt - session.start_at) / 1000);

                session.end_at = endAt;
                session.duration_seconds = duration;
                if (hadOrder !== undefined) session.had_order = hadOrder;

                await session.save();

                // Update User Stats
                const user = await User.findById(userId);
                if (user) {
                    await user.recordLogout({
                        sessionDurationSeconds: duration,
                        hadOrder: session.had_order
                    });
                }
            }
        }

        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Refresh Token
// @route   POST /api/v1/auth/refresh
// @access  Public
const refresh = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const decoded = authService.verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        if (!user.is_active) {
            return res.status(401).json({ message: 'User is inactive' });
        }

        const accessToken = authService.generateAccessToken(user);

        res.status(200).json({
            success: true,
            accessToken
        });
    } catch (error) {
        return res.status(403).json({ message: 'Invalid refresh token' });
    }
};

// Legacy endpoints for backward compatibility - will be removed later

module.exports = {
    requestOtp,
    verifyOtp,
    resendOtp,
    updateProfile,
    getProfile,
    logout,
    refresh
};