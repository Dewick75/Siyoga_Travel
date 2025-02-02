// Utility helper functions
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Hash password
const hashPassword = async (password) => {
    try {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    } catch (error) {
        throw new Error('Error hashing password');
    }
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        throw new Error('Error comparing password');
    }
};

// Generate JWT token
const generateToken = (payload) => {
    try {
        return jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        });
    } catch (error) {
        throw new Error('Error generating token');
    }
};

// Verify JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

// Generate verification token
const generateVerificationToken = () => {
    return uuidv4();
};

// Generate token expiry (24 hours from now)
const generateTokenExpiry = () => {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    return expiry;
};

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password strength
const isValidPassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

// Validate phone number (Sri Lankan format)
const isValidPhone = (phone) => {
    // Sri Lankan phone number format: +94xxxxxxxxx or 0xxxxxxxxx
    const phoneRegex = /^(\+94|0)[0-9]{9}$/;
    return phoneRegex.test(phone);
};

// Format response
const formatResponse = (success, message, data = null) => {
    return {
        success,
        message,
        ...(data && { data }),
        timestamp: new Date().toISOString()
    };
};

// Format error response
const formatError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.status = statusCode;
    return error;
};

// Sanitize user data (remove password and sensitive info)
const sanitizeUser = (user) => {
    if (!user) return null;
    
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
};

// Generate random string
const generateRandomString = (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    generateVerificationToken,
    generateTokenExpiry,
    isValidEmail,
    isValidPassword,
    isValidPhone,
    formatResponse,
    formatError,
    sanitizeUser,
    generateRandomString
};
