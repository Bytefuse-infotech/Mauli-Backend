const User = require('../models/User');
const UserSession = require('../models/UserSession');
const authService = require('../services/authService');

// @desc    Login user
// @route   POST /api/v1/auth/login
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

module.exports = {
    login,
    logout,
    refresh
};
