const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Config
const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '30d';
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

// Generate Access Token
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES }
    );
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES }
    );
};

// Verify Access Token
const verifyAccessToken = (token) => {
    return jwt.verify(token, ACCESS_SECRET);
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
    return jwt.verify(token, REFRESH_SECRET);
};

// Hash Password
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
};

// Compare Password
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

// Generate OTP
const generateOtp = () => {
    // For testing, always return 000000
    return '000000';
    // return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    hashPassword,
    comparePassword,
    generateOtp
};
