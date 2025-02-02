// Authentication middleware
const { verifyToken, formatError } = require('../utils/helpers');
const { getOne } = require('../config/database');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify token
        const decoded = verifyToken(token);
        
        // Get user from database
        const user = await getOne(
            'SELECT user_id, email, role, is_verified, is_active FROM users WHERE user_id = ?',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token - user not found'
            });
        }

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Add user to request object
        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// Check if user is verified
const requireVerification = (req, res, next) => {
    if (!req.user.is_verified) {
        return res.status(403).json({
            success: false,
            message: 'Email verification required'
        });
    }
    next();
};

// Check user role
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }
        next();
    };
};

// Check if user is admin
const requireAdmin = requireRole(['admin']);

// Check if user is tourist
const requireTourist = requireRole(['tourist']);

// Check if user is driver
const requireDriver = requireRole(['driver']);

// Check if user is tourist or driver
const requireTouristOrDriver = requireRole(['tourist', 'driver']);

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            const user = await getOne(
                'SELECT user_id, email, role, is_verified, is_active FROM users WHERE user_id = ?',
                [decoded.userId]
            );

            if (user && user.is_active) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

module.exports = {
    authenticateToken,
    requireVerification,
    requireRole,
    requireAdmin,
    requireTourist,
    requireDriver,
    requireTouristOrDriver,
    optionalAuth
};
