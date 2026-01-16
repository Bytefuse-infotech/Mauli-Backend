const User = require('../models/User');
const UserSession = require('../models/UserSession');
const authService = require('../services/authService');

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
        const user = await User.findById(req.user._id);

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

// Helper function to detect if identifier is email or phone
const isEmail = (identifier) => {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(identifier);
};

// Helper to format phone number
const formatPhone = (phone) => {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    // Add +91 prefix if not present and is 10 digits
    if (cleaned.length === 10) {
        cleaned = '+91' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
        cleaned = '+' + cleaned;
    }
    return cleaned;
};

// @desc    Register new user with email/phone and password
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { identifier, password, name, phone, email } = req.body;

        // Support both old format (phone/email fields) and new format (identifier field)
        const authIdentifier = identifier || phone || email;

        if (!authIdentifier || !password || !name) {
            return res.status(400).json({ message: 'Please provide email/phone, password, and name' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const identifierIsEmail = isEmail(authIdentifier);
        let userEmail, userPhone;

        if (identifierIsEmail) {
            userEmail = authIdentifier.toLowerCase();
            // Generate unique placeholder phone
            userPhone = `+91${Date.now().toString().slice(-10)}`;
        } else {
            userPhone = formatPhone(authIdentifier);
            // Validate phone format
            if (!/^\+91\d{10}$/.test(userPhone)) {
                return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
            }
            // Generate placeholder email
            userEmail = `${userPhone.replace('+', '')}@user.mauli.com`;
        }

        // Check if user already exists by email or phone
        const existingUser = await User.findOne({
            $or: [
                { email: userEmail },
                { phone: userPhone }
            ]
        });

        if (existingUser) {
            const field = existingUser.email === userEmail ? 'email' : 'phone number';
            return res.status(400).json({ message: `User with this ${field} already exists` });
        }

        // Hash password
        const password_hash = await authService.hashPassword(password);

        // Create user
        const user = await User.create({
            phone: userPhone,
            name,
            email: userEmail,
            password_hash,
            role: 'customer',
            is_active: true,
            is_phone_verified: !identifierIsEmail,
            is_email_verified: identifierIsEmail
        });

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

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                is_phone_verified: user.is_phone_verified,
                is_email_verified: user.is_email_verified
            },
            sessionId: session._id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Login with email/phone and password
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { identifier, password, phone, email } = req.body;

        // Support both old format (phone/email fields) and new format (identifier field)
        const authIdentifier = identifier || phone || email;

        if (!authIdentifier || !password) {
            return res.status(400).json({ message: 'Please provide email/phone and password' });
        }

        const identifierIsEmail = isEmail(authIdentifier);
        let query;

        if (identifierIsEmail) {
            query = { email: authIdentifier.toLowerCase() };
        } else {
            const formattedPhone = formatPhone(authIdentifier);
            query = { phone: formattedPhone };
        }

        // Find user and include password_hash
        const user = await User.findOne(query).select('+password_hash');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.password_hash) {
            return res.status(401).json({ message: 'Please register with a password first' });
        }

        // Compare password
        const isMatch = await authService.comparePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(401).json({ message: 'Account is inactive. Please contact support.' });
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
                is_phone_verified: user.is_phone_verified,
                is_email_verified: user.is_email_verified
            },
            sessionId: session._id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Legacy endpoints kept for backward compatibility
const signup = async (req, res) => {
    return register(req, res);
};

const verifySignup = async (req, res) => {
    return res.status(400).json({ message: 'OTP verification is no longer required. Please use /register instead.' });
};

// @desc    Forgot Password - Send password reset link
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    return res.status(501).json({
        success: false,
        message: 'Password reset feature coming soon. Please contact support.'
    });
};

// @desc    Reset Password
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    return res.status(501).json({
        success: false,
        message: 'Password reset feature coming soon. Please contact support.'
    });
};

// @desc    Update Password
// @route   PUT /api/v1/auth/update-password
// @access  Private
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user._id;

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

        const user = await User.findById(userId).select('+password_hash');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.password_hash) {
            return res.status(400).json({
                success: false,
                message: 'No password set for this account'
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

        // Hash new password and save
        user.password_hash = await authService.hashPassword(newPassword);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

module.exports = {
    updateProfile,
    getProfile,
    logout,
    refresh,
    // Password-based auth
    login,
    register,
    // Legacy endpoints
    signup,
    verifySignup,
    forgotPassword,
    resetPassword,
    updatePassword
};