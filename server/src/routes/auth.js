// Authentication routes
const express = require('express');
const { body, validationResult } = require('express-validator');
const { 
    hashPassword, 
    comparePassword, 
    generateToken, 
    generateVerificationToken, 
    generateTokenExpiry,
    isValidEmail, 
    isValidPassword,
    formatResponse,
    formatError,
    sanitizeUser
} = require('../utils/helpers');
const { executeQuery, getOne, insertRecord, updateRecord } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Validation rules
const registerValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('role')
        .isIn(['tourist', 'driver'])
        .withMessage('Role must be either tourist or driver'),
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// POST /api/auth/register - User registration
router.post('/register', registerValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password, role, firstName, lastName, phone } = req.body;

        // Check if user already exists
        const existingUser = await getOne(
            'SELECT user_id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser) {
            return res.status(409).json(formatResponse(
                false, 
                'User with this email already exists'
            ));
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Start transaction
        const connection = await require('../config/database').pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insert user
            const userId = await insertRecord(
                'INSERT INTO users (email, password, role, is_verified, is_active) VALUES (?, ?, ?, ?, ?)',
                [email, hashedPassword, role, false, true]
            );

            // Insert OTP verification
            await insertRecord(
                'INSERT INTO email_verification (user_id, verification_token, expires_at) VALUES (?, ?, ?)',
                [userId, otp, otpExpiry]
            );

            // Insert profile based on role
            if (role === 'tourist') {
                await insertRecord(
                    'INSERT INTO tourists (user_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)',
                    [userId, firstName, lastName, phone || null]
                );
            } else if (role === 'driver') {
                await insertRecord(
                    'INSERT INTO drivers (user_id, first_name, last_name, phone, status) VALUES (?, ?, ?, ?, ?)',
                    [userId, firstName, lastName, phone || null, 'pending']
                );
            }

            await connection.commit();
            connection.release();

            // Send OTP email
            try {
                await emailService.sendOTPEmail(email, firstName, otp);
                console.log(`✅ OTP email sent to ${email}`);
            } catch (emailError) {
                console.error('❌ Failed to send OTP email:', emailError);
                // Don't fail registration if email fails
            }

            res.status(201).json(formatResponse(
                true,
                'Registration successful! Please check your email for OTP verification.',
                {
                    userId,
                    email,
                    role,
                    verificationRequired: true
                }
            ));

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json(formatResponse(
            false,
            'Registration failed. Please try again.'
        ));
    }
});

// POST /api/auth/verify-otp - Verify OTP
router.post('/verify-otp', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, otp } = req.body;

        // Find user
        const user = await getOne(
            'SELECT user_id, email, is_verified FROM users WHERE email = ?',
            [email]
        );

        if (!user) {
            return res.status(404).json(formatResponse(
                false,
                'User not found'
            ));
        }

        if (user.is_verified) {
            return res.status(400).json(formatResponse(
                false,
                'Account is already verified'
            ));
        }

        // Check OTP
        const verification = await getOne(
            'SELECT * FROM email_verification WHERE user_id = ? AND verification_token = ? AND expires_at > NOW()',
            [user.user_id, otp]
        );

        if (!verification) {
            return res.status(400).json(formatResponse(
                false,
                'Invalid or expired OTP'
            ));
        }

        // Update user as verified
        await updateRecord(
            'UPDATE users SET is_verified = true WHERE user_id = ?',
            [user.user_id]
        );

        // Delete verification record
        await deleteRecord(
            'DELETE FROM email_verification WHERE user_id = ?',
            [user.user_id]
        );

        return res.status(200).json(formatResponse(
            true,
            'Email verified successfully! You can now login.',
            {
                email: user.email,
                verified: true
            }
        ));

    } catch (error) {
        console.error('OTP verification error:', error);
        return res.status(500).json(formatResponse(
            false,
            'Verification failed. Please try again.'
        ));
    }
});

// POST /api/auth/login - User login
router.post('/login', loginValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Get user from database
        const user = await getOne(
            'SELECT user_id, email, password, role, is_verified, is_active FROM users WHERE email = ?',
            [email]
        );

        if (!user) {
            return res.status(401).json(formatResponse(
                false,
                'Invalid email or password'
            ));
        }

        if (!user.is_active) {
            return res.status(401).json(formatResponse(
                false,
                'Account is deactivated. Please contact support.'
            ));
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json(formatResponse(
                false,
                'Invalid email or password'
            ));
        }

        // Generate JWT token
        const token = generateToken({
            userId: user.user_id,
            email: user.email,
            role: user.role
        });

        // Get profile information based on role
        let profile = null;
        if (user.role === 'tourist') {
            profile = await getOne(
                'SELECT tourist_id, first_name, last_name, phone, country FROM tourists WHERE user_id = ?',
                [user.user_id]
            );
        } else if (user.role === 'driver') {
            profile = await getOne(
                'SELECT driver_id, first_name, last_name, phone, status FROM drivers WHERE user_id = ?',
                [user.user_id]
            );
        }

        res.json(formatResponse(
            true,
            'Login successful',
            {
                token,
                user: sanitizeUser(user),
                profile,
                expiresIn: process.env.JWT_EXPIRES_IN || '7d'
            }
        ));

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json(formatResponse(
            false,
            'Login failed. Please try again.'
        ));
    }
});

// POST /api/auth/verify-email - Email verification
router.post('/verify-email', [
    body('token').notEmpty().withMessage('Verification token is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { token } = req.body;

        // Get verification token
        const verification = await getOne(
            `SELECT ev.*, u.email, u.user_id
             FROM email_verification ev
             JOIN users u ON ev.user_id = u.user_id
             WHERE ev.verification_token = ? AND ev.is_used = FALSE`,
            [token]
        );

        if (!verification) {
            return res.status(400).json(formatResponse(
                false,
                'Invalid or expired verification token'
            ));
        }

        // Check if token is expired
        if (new Date() > new Date(verification.expires_at)) {
            return res.status(400).json(formatResponse(
                false,
                'Verification token has expired. Please request a new one.'
            ));
        }

        // Update user as verified and mark token as used
        await updateRecord(
            'UPDATE users SET is_verified = TRUE WHERE user_id = ?',
            [verification.user_id]
        );

        await updateRecord(
            'UPDATE email_verification SET is_used = TRUE WHERE token_id = ?',
            [verification.token_id]
        );

        res.json(formatResponse(
            true,
            'Email verified successfully! You can now login.',
            {
                email: verification.email,
                verified: true
            }
        ));

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json(formatResponse(
            false,
            'Email verification Success.'
        ));
    }
});

// POST /api/auth/resend-verification - Resend verification email
router.post('/resend-verification', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email } = req.body;

        // Get user
        const user = await getOne(
            'SELECT user_id, email, is_verified FROM users WHERE email = ?',
            [email]
        );

        if (!user) {
            return res.status(404).json(formatResponse(
                false,
                'User not found'
            ));
        }

        if (user.is_verified) {
            return res.status(400).json(formatResponse(
                false,
                'Email is already verified'
            ));
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const tokenExpiry = generateTokenExpiry();

        // Insert new verification token
        await insertRecord(
            'INSERT INTO email_verification (user_id, verification_token, expires_at) VALUES (?, ?, ?)',
            [user.user_id, verificationToken, tokenExpiry]
        );

        // Send verification email
        try {
            await emailService.sendVerificationEmail(email, user.first_name || 'User', verificationToken);
            console.log(`✅ New verification email sent to ${email}`);
        } catch (emailError) {
            console.error('❌ Failed to send verification email:', emailError);
            // Don't fail the request if email fails
        }

        res.json(formatResponse(
            true,
            'Verification email sent successfully!'
        ));

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json(formatResponse(
            false,
            'Failed to resend verification email. Please try again.'
        ));
    }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = req.user;

        // Get profile information based on role
        let profile = null;
        if (user.role === 'tourist') {
            profile = await getOne(
                'SELECT tourist_id, first_name, last_name, phone, date_of_birth, gender, country, emergency_contact_name, emergency_contact_phone FROM tourists WHERE user_id = ?',
                [user.user_id]
            );
        } else if (user.role === 'driver') {
            profile = await getOne(
                'SELECT driver_id, first_name, last_name, phone, nic_number, license_number, license_expiry, status FROM drivers WHERE user_id = ?',
                [user.user_id]
            );
        }

        res.json(formatResponse(
            true,
            'User information retrieved successfully',
            {
                user: sanitizeUser(user),
                profile
            }
        ));

    } catch (error) {
        console.error('Get user info error:', error);
        res.status(500).json(formatResponse(
            false,
            'Failed to get user information'
        ));
    }
});

// Test email endpoint
router.post('/test-email', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json(formatError('Email is required'));
        }

        const result = await emailService.sendTestEmail(email);

        if (result.success) {
            res.json(formatResponse(
                true,
                'Test email sent successfully!',
                { messageId: result.messageId }
            ));
        } else {
            res.status(500).json(formatError('Failed to send test email: ' + result.error));
        }
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json(formatError('Internal server error'));
    }
});

module.exports = router;
