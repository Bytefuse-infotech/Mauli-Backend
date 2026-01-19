const User = require('../models/User');
const UserSession = require('../models/UserSession');
const authService = require('../services/authService');
const bcrypt = require('bcryptjs');

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields if provided
        if (name) user.name = name;
        if (address) user.address = address;

        // Allow email update (for users who signed up with phone)
        if (email && email !== user.email) {
            // Skip if it's a placeholder email
            if (!email.endsWith('@user.mauli.com')) {
                // Validate email format
                // Use permissive regex to support modern TLDs and aliases
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Please enter a valid email address'
                    });
                }

                // Check if email already exists
                const existingUser = await User.findOne({
                    email: email.toLowerCase(),
                    _id: { $ne: userId }
                });

                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'This email is already registered'
                    });
                }

                user.email = email.toLowerCase();
                user.is_email_verified = false; // Reset verification when email changes
            }
        }

        // Allow phone update (for users who signed up with email)
        if (phone !== undefined) {
            // If user is trying to add/update phone
            if (phone && phone !== user.phone) {
                // Validate phone format
                const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
                if (!/^\+91\d{10}$/.test(formattedPhone)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Please enter a valid 10-digit mobile number'
                    });
                }

                // Check if phone number already exists
                const existingUser = await User.findOne({
                    phone: formattedPhone,
                    _id: { $ne: userId } // Exclude current user
                });

                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'This phone number is already registered'
                    });
                }

                user.phone = formattedPhone;
                user.is_phone_verified = false; // Reset verification when phone changes
            }
        }

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

        // Send response immediately for instant client-side logout
        res.status(200).json({ success: true, message: 'Logged out successfully' });

        // Perform session and user updates asynchronously in background
        // This doesn't block the response
        if (sessionId) {
            (async () => {
                try {
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
                } catch (error) {
                    console.error('Background logout processing error:', error);
                }
            })();
        }
    } catch (error) {
        console.error(error);
        // Only send error response if we haven't already sent the success response
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server Error' });
        }
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
    // Use permissive regex consistent with frontend to allow aliases (e.g. +)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
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

// @desc    Check if a user exists by phone or email
// @route   POST /api/v1/auth/check-user
// @access  Public
const checkUserExists = async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: 'Identifier is required'
            });
        }

        const identifierIsEmail = isEmail(identifier);
        let userEmail, userPhone;

        if (identifierIsEmail) {
            userEmail = identifier.toLowerCase();
        } else {
            userPhone = formatPhone(identifier);
            if (!/^\+91\d{10}$/.test(userPhone)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please enter a valid 10-digit mobile number'
                });
            }
            // Also generate the placeholder email just in case
            userEmail = `${userPhone.replace('+', '')}@user.mauli.com`;
        }

        // Check if user exists by email or phone
        const existingUser = await User.findOne({
            $or: [
                { email: userEmail },
                { phone: userPhone }
            ]
        });

        if (existingUser) {
            return res.status(200).json({
                success: true,
                exists: true,
                message: `User with this ${identifierIsEmail ? 'email' : 'phone number'} already exists. Please login instead.`
            });
        }

        res.status(200).json({
            success: true,
            exists: false,
            message: 'User does not exist'
        });
    } catch (error) {
        console.error('Error in checkUserExists:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server Error'
        });
    }
};

// @desc    Register new user with email/phone and password
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { identifier, password, name, phone, email, idToken } = req.body;

        // Support both old format (phone/email fields) and new format (identifier field)
        const authIdentifier = identifier || phone || email;

        if (!authIdentifier || !password || !name) {
            return res.status(400).json({ message: 'Please provide email/phone, password, and name' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const identifierIsEmail = isEmail(authIdentifier);
        let userEmail, userPhone, firebaseUid;

        if (identifierIsEmail) {
            userEmail = authIdentifier.toLowerCase();
            // Don't generate placeholder phone - user can add it later from profile
            userPhone = null;
        } else {
            userPhone = formatPhone(authIdentifier);
            // Validate phone format
            if (!/^\+91\d{10}$/.test(userPhone)) {
                return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number' });
            }

            // ENFORCE OTP VERIFICATION FOR PHONE REGISTRATION
            if (!idToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Mobile number verification required. Please verify with OTP first.'
                });
            }

            try {
                const { verifyIdToken } = require('../utils/firebase');
                const decoded = await verifyIdToken(idToken);

                if (!decoded || !decoded.phone) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid verification token. Please try again.'
                    });
                }

                // Ensure the token's phone matches the requested phone
                const tokenPhone = formatPhone(decoded.phone);
                if (tokenPhone !== userPhone) {
                    console.warn(`Phone mismatch: token(${tokenPhone}) vs request(${userPhone})`);
                    return res.status(401).json({
                        success: false,
                        message: 'Verification token does not match the provided phone number.'
                    });
                }

                firebaseUid = decoded.uid;
            } catch (err) {
                console.error('Registration token verification failed:', err);
                return res.status(401).json({
                    success: false,
                    message: 'Verification failed. Please try again.'
                });
            }

            // Use user-provided email if available; otherwise, leave it null
            if (email && isEmail(email)) {
                userEmail = email.toLowerCase();
            } else {
                userEmail = null;  // No placeholder - email is optional
            }
        }

        // Check if user already exists by email or phone
        const existingUserQuery = { phone: userPhone };
        if (userEmail) {
            existingUserQuery.$or = [{ email: userEmail }, { phone: userPhone }];
            delete existingUserQuery.phone;
        }
        const existingUser = await User.findOne(existingUserQuery);

        if (existingUser) {
            const field = userEmail && existingUser.email === userEmail ? 'email' : 'phone number';
            return res.status(400).json({ message: `User with this ${field} already exists` });
        }

        // Hash password
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
            is_email_verified: identifierIsEmail,
            firebase_uid: firebaseUid
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
            return res.status(401).json({
                success: false,
                message: 'No account found with this email/phone. Please create a new account.',
                errorType: 'USER_NOT_FOUND'
            });
        }

        if (!user.password_hash) {
            return res.status(401).json({
                success: false,
                message: 'Please register with a password first',
                errorType: 'NO_PASSWORD'
            });
        }

        // Compare password
        const isMatch = await authService.comparePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password. Please try again.',
                errorType: 'WRONG_PASSWORD'
            });
        }

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive. Please contact support.',
                errorType: 'INACTIVE'
            });
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

// @desc    Firebase Phone OTP Login/Signup
// @route   POST /api/v1/auth/firebase-login
// @access  Public
const firebaseLogin = async (req, res) => {
    try {
        const { idToken, name } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'Firebase ID token is required'
            });
        }

        // Import Firebase verification utility
        const { verifyIdToken } = require('../utils/firebase');

        // Verify the Firebase ID token
        const decoded = await verifyIdToken(idToken);

        if (!decoded || !decoded.phone) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token. Please try again.'
            });
        }

        const phoneNumber = decoded.phone;

        // Find existing user or create new one
        let user = await User.findOne({ phone: phoneNumber });
        let isNewUser = false;

        if (!user) {
            // New user - create account
            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Name is required for new users',
                    requiresName: true
                });
            }

            // Email is optional - don't generate placeholder
            user = await User.create({
                phone: phoneNumber,
                name: name.trim(),
                email: null,  // No placeholder - email is optional
                role: 'customer',
                is_active: true,
                is_phone_verified: true,
                firebase_uid: decoded.uid
            });

            isNewUser = true;
        } else {
            // Existing user - update Firebase UID if not set
            if (!user.firebase_uid) {
                user.firebase_uid = decoded.uid;
                await user.save();
            }

            // Check if user is active
            if (!user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is inactive. Please contact support.'
                });
            }
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

        // Generate JWT Tokens
        const accessToken = authService.generateAccessToken(user);
        const refreshToken = authService.generateRefreshToken(user);

        res.status(isNewUser ? 201 : 200).json({
            success: true,
            message: isNewUser ? 'Account created successfully' : 'Login successful',
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
            sessionId: session._id,
            isNewUser
        });

    } catch (error) {
        console.error('Firebase login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Reset Password with OTP verification
// @route   POST /api/v1/auth/reset-password-otp
// @access  Public
const resetPasswordOtp = async (req, res) => {
    try {
        const { phone, idToken, newPassword } = req.body;

        if (!phone || !idToken || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Phone, Firebase token, and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Verify the Firebase ID token
        const { verifyIdToken } = require('../utils/firebase');
        const decoded = await verifyIdToken(idToken);

        if (!decoded || !decoded.phone) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // Ensure the verified phone matches the requested phone
        if (decoded.phone !== phone) {
            return res.status(401).json({
                success: false,
                message: 'Phone number does not match verified token'
            });
        }

        // Find user by phone
        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this phone number'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user password
        user.password_hash = hashedPassword;
        user.is_phone_verified = true;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful'
        });

    } catch (error) {
        console.error('Reset password OTP error:', error);
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
    // Password-based auth (kept for admin/legacy)
    login,
    register,
    checkUserExists,
    // Firebase phone OTP auth
    firebaseLogin,
    // OTP-based password reset
    resetPasswordOtp,
    // Legacy endpoints
    signup,
    verifySignup,
    forgotPassword,
    resetPassword,
    updatePassword
};