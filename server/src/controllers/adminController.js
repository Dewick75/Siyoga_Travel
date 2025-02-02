// Admin Controller - Dashboard and Reports
const { executeQuery, getOne } = require('../config/database');
const { formatResponse, formatError } = require('../utils/helpers');
// const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        // Get user statistics
        const userStats = await executeQuery(`
            SELECT 
                role,
                COUNT(*) as count,
                SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_count,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
            FROM users 
            WHERE role != 'admin'
            GROUP BY role
        `);

        // Get driver status statistics
        const driverStats = await executeQuery(`
            SELECT 
                status,
                COUNT(*) as count
            FROM drivers 
            GROUP BY status
        `);

        // Get booking statistics
        const bookingStats = await executeQuery(`
            SELECT 
                status,
                COUNT(*) as count,
                SUM(total_cost) as total_revenue
            FROM bookings 
            GROUP BY status
        `);

        // Get recent registrations (last 30 days)
        const recentRegistrations = await executeQuery(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM users 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND role != 'admin'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        `);

        // Get total counts
        const totalUsers = await getOne('SELECT COUNT(*) as count FROM users WHERE role != "admin"');
        const totalDrivers = await getOne('SELECT COUNT(*) as count FROM drivers');
        const totalTourists = await getOne('SELECT COUNT(*) as count FROM tourists');
        const totalBookings = await getOne('SELECT COUNT(*) as count FROM bookings');
        const totalRevenue = await getOne('SELECT SUM(total_cost) as total FROM bookings WHERE status = "completed"');

        res.json(formatResponse(true, 'Dashboard statistics retrieved successfully', {
            userStats,
            driverStats,
            bookingStats,
            recentRegistrations,
            totals: {
                users: totalUsers?.count || 0,
                drivers: totalDrivers?.count || 0,
                tourists: totalTourists?.count || 0,
                bookings: totalBookings?.count || 0,
                revenue: totalRevenue?.total || 0
            }
        }));

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json(formatResponse(false, 'Failed to retrieve dashboard statistics'));
    }
};

// Get all users with profiles
const getAllUsers = async (req, res) => {
    try {
        const users = await executeQuery(`
            SELECT 
                u.user_id,
                u.email,
                u.role,
                u.is_verified,
                u.is_active,
                u.created_at,
                CASE 
                    WHEN u.role = 'tourist' THEN CONCAT(t.first_name, ' ', t.last_name)
                    WHEN u.role = 'driver' THEN CONCAT(d.first_name, ' ', d.last_name)
                    ELSE 'N/A'
                END as full_name,
                CASE 
                    WHEN u.role = 'tourist' THEN t.phone
                    WHEN u.role = 'driver' THEN d.phone
                    ELSE NULL
                END as phone,
                CASE 
                    WHEN u.role = 'driver' THEN d.status
                    ELSE NULL
                END as driver_status
            FROM users u
            LEFT JOIN tourists t ON u.user_id = t.user_id
            LEFT JOIN drivers d ON u.user_id = d.user_id
            WHERE u.role != 'admin'
            ORDER BY u.created_at DESC
        `);

        res.json(formatResponse(true, 'Users retrieved successfully', users));

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json(formatResponse(false, 'Failed to retrieve users'));
    }
};

// Get all drivers with details
const getAllDrivers = async (req, res) => {
    try {
        const drivers = await executeQuery(`
            SELECT 
                d.*,
                u.email,
                u.is_verified,
                u.is_active,
                u.created_at as user_created_at,
                COUNT(v.vehicle_id) as vehicle_count,
                COUNT(b.booking_id) as total_bookings
            FROM drivers d
            JOIN users u ON d.user_id = u.user_id
            LEFT JOIN vehicles v ON d.driver_id = v.driver_id
            LEFT JOIN bookings b ON d.driver_id = b.driver_id
            GROUP BY d.driver_id
            ORDER BY d.created_at DESC
        `);

        res.json(formatResponse(true, 'Drivers retrieved successfully', drivers));

    } catch (error) {
        console.error('Get drivers error:', error);
        res.status(500).json(formatResponse(false, 'Failed to retrieve drivers'));
    }
};

// Get all bookings with details
const getAllBookings = async (req, res) => {
    try {
        const bookings = await executeQuery(`
            SELECT 
                b.*,
                CONCAT(t.first_name, ' ', t.last_name) as tourist_name,
                t.phone as tourist_phone,
                tu.email as tourist_email,
                CONCAT(d.first_name, ' ', d.last_name) as driver_name,
                d.phone as driver_phone,
                du.email as driver_email,
                vc.category_name,
                vc.base_price_per_km
            FROM bookings b
            JOIN tourists t ON b.tourist_id = t.tourist_id
            JOIN users tu ON t.user_id = tu.user_id
            LEFT JOIN drivers d ON b.driver_id = d.driver_id
            LEFT JOIN users du ON d.user_id = du.user_id
            LEFT JOIN vehicle_categories vc ON b.selected_category_id = vc.category_id
            ORDER BY b.created_at DESC
        `);

        res.json(formatResponse(true, 'Bookings retrieved successfully', bookings));

    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json(formatResponse(false, 'Failed to retrieve bookings'));
    }
};

// Update driver status
const updateDriverStatus = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { status, adminNotes } = req.body;

        if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
            return res.status(400).json(formatResponse(false, 'Invalid status'));
        }

        await executeQuery(
            'UPDATE drivers SET status = ?, admin_notes = ?, updated_at = NOW() WHERE driver_id = ?',
            [status, adminNotes || null, driverId]
        );

        res.json(formatResponse(true, 'Driver status updated successfully'));

    } catch (error) {
        console.error('Update driver status error:', error);
        res.status(500).json(formatResponse(false, 'Failed to update driver status'));
    }
};

// Toggle user active status
const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await getOne('SELECT is_active FROM users WHERE user_id = ?', [userId]);
        if (!user) {
            return res.status(404).json(formatResponse(false, 'User not found'));
        }

        const newStatus = !user.is_active;
        await executeQuery(
            'UPDATE users SET is_active = ?, updated_at = NOW() WHERE user_id = ?',
            [newStatus, userId]
        );

        res.json(formatResponse(true, `User ${newStatus ? 'activated' : 'deactivated'} successfully`));

    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json(formatResponse(false, 'Failed to update user status'));
    }
};

// Simple checkpoint logging system
const logAdminAction = async (adminUserId, action, details = {}) => {
    try {
        await executeQuery(`
            INSERT INTO admin_logs (admin_user_id, action, details, created_at)
            VALUES (?, ?, ?, NOW())
        `, [adminUserId, action, JSON.stringify(details)]);
    } catch (error) {
        console.error('Failed to log admin action:', error);
        // Don't throw error to avoid breaking main functionality
    }
};

// Get admin activity logs
const getAdminLogs = async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const logs = await executeQuery(`
            SELECT
                al.*,
                u.email as admin_email
            FROM admin_logs al
            JOIN users u ON al.admin_user_id = u.user_id
            ORDER BY al.created_at DESC
            LIMIT ?
        `, [parseInt(limit)]);

        res.json(formatResponse(true, 'Admin logs retrieved successfully', logs));

    } catch (error) {
        console.error('Get admin logs error:', error);
        res.status(500).json(formatResponse(false, 'Failed to retrieve admin logs'));
    }
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    getAllDrivers,
    getAllBookings,
    updateDriverStatus,
    toggleUserStatus,
    getAdminLogs,
    logAdminAction
};
