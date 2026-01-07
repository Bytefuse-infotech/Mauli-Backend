const User = require('../models/User');
const UserSession = require('../models/UserSession');
const authService = require('../services/authService');
const sendOtp = require('../utils/sendOtp');

// @desc    Register user (Step 1)
// @route   POST /api/v1/auth/signup
// @access  Public
const signup = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if user exists
        let user = await User.findOne({ $or: [{ email }, { phone }] });

        if (user) {
            if (user.is_active) {
                return res.status(400).json({ message: 'User already exists' });
            }
            // If user exists but is inactive, we could resend OTP or update details.
            // For simplicity, if they aren't active, we update their details and new password/OTP
            // CAUTION: This allows overwriting unverified accounts. This is usually desired behavior.
        }

        const password_hash = await authService.hashPassword(password);

        // Generate OTP
        const otp = authService.generateOtp();
        const otp_hash = await authService.hashPassword(otp);
        const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        if (!user) {
            user = await User.create({
                name,
                email,
                phone,
                password_hash,
                role: 'customer',
                is_active: false, // Inactive until OTP verified
                otp_hash,
                otp_expires_at
            });
        } else {
            // Update existing unverified user
            user.name = name;
            user.email = email;
            user.phone = phone; // Ensure phone is updated if it was different
            user.password_hash = password_hash;
            user.otp_hash = otp_hash;
            user.otp_expires_at = otp_expires_at;
            await user.save();
        }

        // Send OTP
        await sendOtp(phone, otp, 'phone');

        res.status(200).json({
            success: true,
            message: `OTP sent to ${phone}`,
            // In dev mode, maybe send OTP in response for testing?
            // dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Verify Signup OTP (Step 2)
// @route   POST /api/v1/auth/verify-signup
// @access  Public
const verifySignup = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ message: 'Please provide phone and OTP' });
        }

        const user = await User.findOne({ phone }).select('+otp_hash');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.is_active) {
            return res.status(400).json({ message: 'User already verified, please login' });
        }

        if (!user.otp_hash || !user.otp_expires_at) {
            return res.status(400).json({ message: 'No OTP request found' });
        }

        if (user.otp_expires_at < new Date()) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        const isMatch = await authService.comparePassword(otp, user.otp_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Activate User
        user.is_active = true;
        user.is_phone_verified = true;
        user.otp_hash = undefined;
        user.otp_expires_at = undefined;
        await user.save();

        // Auto Login
        const ip = req.ip || req.connection.remoteAddress;
        await user.recordLogin({ ip });

        const session = await UserSession.create({
            user_id: user._id,
            start_at: new Date(),
            ip: ip,
            user_agent: req.headers['user-agent'],
        });

        const accessToken = authService.generateAccessToken(user);
        const refreshToken = authService.generateRefreshToken(user);

        res.status(200).json({
            success: true,
            message: 'User verified and logged in',
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            },
            sessionId: session._id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ message: 'Please provide phone number' });
        }

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate OTP
        const otp = authService.generateOtp();
        const otp_hash = await authService.hashPassword(otp);
        const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        user.otp_hash = otp_hash;
        user.otp_expires_at = otp_expires_at;
        await user.save();

        await sendOtp(phone, otp, 'phone');

        res.status(200).json({
            success: true,
            message: `OTP sent to ${phone}`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reset Password
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { phone, otp, newPassword } = req.body;

        if (!phone || !otp || !newPassword) {
            return res.status(400).json({ message: 'Please provide phone, OTP, and new password' });
        }

        const user = await User.findOne({ phone }).select('+otp_hash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.otp_hash || !user.otp_expires_at) {
            return res.status(400).json({ message: 'No OTP request found' });
        }

        if (user.otp_expires_at < new Date()) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        const isMatch = await authService.comparePassword(otp, user.otp_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Reset Password
        user.password_hash = await authService.hashPassword(newPassword);
        user.otp_hash = undefined;
        user.otp_expires_at = undefined;

        // Optionally revoke all sessions here for security

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. Please login with new password.'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password, phone } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Please provide password' });
        }

        let user;
        if (email) {
            user = await User.findOne({ email }).select('+password_hash');
        } else if (phone) {
            user = await User.findOne({ phone }).select('+password_hash');
        } else {
            return res.status(400).json({ message: 'Please provide email or phone' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await authService.comparePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(401).json({ message: 'User is inactive' });
        }

        // Record Login
        const ip = req.ip || req.connection.remoteAddress;
        await user.recordLogin({ ip });

        // Create Session
        const session = await UserSession.create({
            user_id: user._id,
            start_at: new Date(),
            ip: ip,
            user_agent: req.headers['user-agent'],
            device: 'unknown' // could parse user-agent
        });

        // Generate Tokens
        // We can embed sessionId in token if we want strict session binding, 
        // but for now let's keep it standard.
        const accessToken = authService.generateAccessToken(user);
        const refreshToken = authService.generateRefreshToken(user);

        res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            sessionId: session._id
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
        // Client should send sessionId to close specific session
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
                // Note: user.recordLogout(sessionDuration, hadOrder)
                // We need to fetch the user document with methods
                const user = await User.findById(userId);
                if (user) {
                    await user.recordLogout({
                        sessionDurationSeconds: duration,
                        hadOrder: session.had_order
                    });
                }
            }
        }

        // In a real scenario with Redis blacklist, we would add the token to blacklist here.

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

// @desc    Update Password (for authenticated users)
// @route   PUT /api/v1/auth/update-password
// @access  Private
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current password, new password, and confirm password'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password do not match'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Get user with password
        const user = await User.findById(req.user._id).select('+password_hash');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isMatch = await authService.comparePassword(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash and save new password
        user.password_hash = await authService.hashPassword(newPassword);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};



module.exports = {
    signup,
    verifySignup,
    login,
    logout,
    refresh,
    forgotPassword,
    resetPassword,
    updatePassword
};
