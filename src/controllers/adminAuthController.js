const User = require('../models/User');
const UserSession = require('../models/UserSession');
const authService = require('../services/authService');

// @desc    Admin Login with Email and Password
// @route   POST /api/v1/admin/auth/login
// @access  Public
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user by email and include password_hash
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password_hash');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is admin or manager
        if (user.role !== 'admin' && user.role !== 'manager') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or manager role required.'
            });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Check if password exists
        if (!user.password_hash) {
            return res.status(401).json({
                success: false,
                message: 'Password not set for this account. Please contact admin to set up password.'
            });
        }

        // Verify password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate tokens
        const accessToken = authService.generateAccessToken(user);
        const refreshToken = authService.generateRefreshToken(user);

        // Create session
        const session = await UserSession.create({
            user_id: user._id,
            refresh_token_hash: await authService.hashPassword(refreshToken),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            user_agent: req.headers['user-agent'],
            ip_address: req.ip || req.connection.remoteAddress
        });

        // Update last login
        await user.recordLogin({ ip: req.ip || req.connection.remoteAddress });

        res.status(200).json({
            success: true,
            message: 'Admin login successful',
            accessToken,
            refreshToken,
            sessionId: session._id,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                is_phone_verified: user.is_phone_verified
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Set password for admin user
// @route   POST /api/v1/admin/auth/set-password
// @access  Private (admin only, for setting up new admin passwords)
const setAdminPassword = async (req, res) => {
    try {
        const { userId, password } = req.body;

        // Only superadmin can set passwords (or self)
        if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to set password for this user'
            });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Only allow setting password for admin/manager roles
        if (user.role !== 'admin' && user.role !== 'manager') {
            return res.status(400).json({
                success: false,
                message: 'Password login is only available for admin/manager accounts'
            });
        }

        // Hash and save password
        user.password_hash = await authService.hashPassword(password);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password set successfully'
        });

    } catch (error) {
        console.error('Set admin password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

module.exports = {
    adminLogin,
    setAdminPassword
};
