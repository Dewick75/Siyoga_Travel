// Admin routes
const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
    getDashboardStats,
    getAllUsers,
    getAllDrivers,
    getAllBookings,
    updateDriverStatus,
    toggleUserStatus,
    getAdminLogs
} = require('../controllers/adminController');
const { formatResponse } = require('../utils/helpers');
// const PDFDocument = require('pdfkit');
const { executeQuery } = require('../config/database');

const router = express.Router();

// Apply authentication and admin role check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard statistics
router.get('/dashboard/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.put('/users/:userId/toggle-status', toggleUserStatus);

// Driver management
router.get('/drivers', getAllDrivers);
router.put('/drivers/:driverId/status', [
    body('status').isIn(['pending', 'approved', 'rejected', 'suspended']).withMessage('Invalid status'),
    body('adminNotes').optional().isLength({ max: 500 }).withMessage('Admin notes too long')
], updateDriverStatus);

// Booking management
router.get('/bookings', getAllBookings);

// Admin activity logs (checkpoint system)
router.get('/logs', getAdminLogs);

// Report generation routes
router.get('/reports/users', async (req, res) => {
    try {
        const { format = 'json', startDate, endDate } = req.query;
        
        let query = `
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
                END as phone
            FROM users u
            LEFT JOIN tourists t ON u.user_id = t.user_id
            LEFT JOIN drivers d ON u.user_id = d.user_id
            WHERE u.role != 'admin'
        `;
        
        const params = [];
        
        if (startDate) {
            query += ' AND u.created_at >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            query += ' AND u.created_at <= ?';
            params.push(endDate + ' 23:59:59');
        }
        
        query += ' ORDER BY u.created_at DESC';
        
        const users = await executeQuery(query, params);
        
        if (format === 'pdf') {
            // Generate PDF report - temporarily disabled
            return res.status(501).json(formatResponse(false, 'PDF generation temporarily disabled'));
            /*
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="users-report.pdf"');
            
            doc.pipe(res);
            
            // PDF Header
            doc.fontSize(20).text('Siyoga Travels - Users Report', 50, 50);
            doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
            
            if (startDate || endDate) {
                doc.text(`Date Range: ${startDate || 'Beginning'} to ${endDate || 'Present'}`, 50, 100);
            }
            
            // Table headers
            let yPosition = 140;
            doc.fontSize(10);
            doc.text('ID', 50, yPosition);
            doc.text('Name', 80, yPosition);
            doc.text('Email', 200, yPosition);
            doc.text('Role', 350, yPosition);
            doc.text('Status', 400, yPosition);
            doc.text('Created', 450, yPosition);
            
            // Draw line under headers
            doc.moveTo(50, yPosition + 15).lineTo(550, yPosition + 15).stroke();
            
            yPosition += 25;
            
            // Table data
            users.forEach((user, index) => {
                if (yPosition > 750) {
                    doc.addPage();
                    yPosition = 50;
                }
                
                doc.text(user.user_id.toString(), 50, yPosition);
                doc.text(user.full_name || 'N/A', 80, yPosition);
                doc.text(user.email, 200, yPosition);
                doc.text(user.role, 350, yPosition);
                doc.text(user.is_active ? 'Active' : 'Inactive', 400, yPosition);
                doc.text(new Date(user.created_at).toLocaleDateString(), 450, yPosition);
                
                yPosition += 20;
            });
            
            // Summary
            doc.addPage();
            doc.fontSize(16).text('Summary', 50, 50);
            doc.fontSize(12);
            doc.text(`Total Users: ${users.length}`, 50, 80);
            doc.text(`Tourists: ${users.filter(u => u.role === 'tourist').length}`, 50, 100);
            doc.text(`Drivers: ${users.filter(u => u.role === 'driver').length}`, 50, 120);
            doc.text(`Active Users: ${users.filter(u => u.is_active).length}`, 50, 140);
            doc.text(`Verified Users: ${users.filter(u => u.is_verified).length}`, 50, 160);
            
            doc.end();
            */
        } else {
            res.json(formatResponse(true, 'Users report generated successfully', {
                users,
                summary: {
                    total: users.length,
                    tourists: users.filter(u => u.role === 'tourist').length,
                    drivers: users.filter(u => u.role === 'driver').length,
                    active: users.filter(u => u.is_active).length,
                    verified: users.filter(u => u.is_verified).length
                }
            }));
        }
        
    } catch (error) {
        console.error('Users report error:', error);
        res.status(500).json(formatResponse(false, 'Failed to generate users report'));
    }
});

router.get('/reports/bookings', async (req, res) => {
    try {
        const { format = 'json', startDate, endDate, status } = req.query;
        
        let query = `
            SELECT 
                b.*,
                CONCAT(t.first_name, ' ', t.last_name) as tourist_name,
                tu.email as tourist_email,
                CONCAT(d.first_name, ' ', d.last_name) as driver_name,
                du.email as driver_email,
                vc.category_name
            FROM bookings b
            JOIN tourists t ON b.tourist_id = t.tourist_id
            JOIN users tu ON t.user_id = tu.user_id
            LEFT JOIN drivers d ON b.driver_id = d.driver_id
            LEFT JOIN users du ON d.user_id = du.user_id
            LEFT JOIN vehicle_categories vc ON b.selected_category_id = vc.category_id
            WHERE 1=1
        `;
        
        const params = [];
        
        if (startDate) {
            query += ' AND b.created_at >= ?';
            params.push(startDate);
        }
        
        if (endDate) {
            query += ' AND b.created_at <= ?';
            params.push(endDate + ' 23:59:59');
        }
        
        if (status) {
            query += ' AND b.status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY b.created_at DESC';
        
        const bookings = await executeQuery(query, params);
        
        if (format === 'pdf') {
            // Generate PDF report - temporarily disabled
            return res.status(501).json(formatResponse(false, 'PDF generation temporarily disabled'));
            /*
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="bookings-report.pdf"');
            
            doc.pipe(res);
            
            // PDF Header
            doc.fontSize(20).text('Siyoga Travels - Bookings Report', 50, 50);
            doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
            
            if (startDate || endDate) {
                doc.text(`Date Range: ${startDate || 'Beginning'} to ${endDate || 'Present'}`, 50, 100);
            }
            
            if (status) {
                doc.text(`Status Filter: ${status}`, 50, 120);
            }
            
            // Summary
            const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_cost || 0), 0);
            doc.text(`Total Bookings: ${bookings.length}`, 50, 140);
            doc.text(`Total Revenue: LKR ${totalRevenue.toLocaleString()}`, 50, 160);
            
            // Table headers
            let yPosition = 200;
            doc.fontSize(8);
            doc.text('ID', 50, yPosition);
            doc.text('Tourist', 80, yPosition);
            doc.text('Driver', 150, yPosition);
            doc.text('Destination', 220, yPosition);
            doc.text('Date', 300, yPosition);
            doc.text('Status', 360, yPosition);
            doc.text('Cost', 420, yPosition);
            
            // Draw line under headers
            doc.moveTo(50, yPosition + 15).lineTo(500, yPosition + 15).stroke();
            
            yPosition += 25;
            
            // Table data
            bookings.forEach((booking) => {
                if (yPosition > 750) {
                    doc.addPage();
                    yPosition = 50;
                }
                
                doc.text(booking.booking_id.toString(), 50, yPosition);
                doc.text(booking.tourist_name || 'N/A', 80, yPosition);
                doc.text(booking.driver_name || 'Unassigned', 150, yPosition);
                doc.text(booking.destination || 'N/A', 220, yPosition);
                doc.text(new Date(booking.start_date).toLocaleDateString(), 300, yPosition);
                doc.text(booking.status, 360, yPosition);
                doc.text(`LKR ${(booking.total_cost || 0).toLocaleString()}`, 420, yPosition);
                
                yPosition += 15;
            });
            
            doc.end();
            */
        } else {
            const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_cost || 0), 0);
            
            res.json(formatResponse(true, 'Bookings report generated successfully', {
                bookings,
                summary: {
                    total: bookings.length,
                    totalRevenue,
                    byStatus: bookings.reduce((acc, b) => {
                        acc[b.status] = (acc[b.status] || 0) + 1;
                        return acc;
                    }, {})
                }
            }));
        }

    } catch (error) {
        console.error('Bookings report error:', error);
        res.status(500).json(formatResponse(false, 'Failed to generate bookings report'));
    }
});

// Driver Performance Report
router.get('/reports/driver-performance', async (req, res) => {
    try {
        const { format = 'json', startDate, endDate } = req.query;

        let query = `
            SELECT
                d.driver_id,
                CONCAT(d.first_name, ' ', d.last_name) as driver_name,
                u.email as driver_email,
                d.phone,
                d.status,
                d.created_at as registration_date,
                COUNT(b.booking_id) as total_bookings,
                COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
                COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
                COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_cost END), 0) as total_earnings,
                COALESCE(AVG(CASE WHEN b.status = 'completed' THEN b.total_cost END), 0) as avg_booking_value,
                COUNT(v.vehicle_id) as vehicle_count,
                GROUP_CONCAT(DISTINCT vc.category_name) as vehicle_categories
            FROM drivers d
            JOIN users u ON d.user_id = u.user_id
            LEFT JOIN bookings b ON d.driver_id = b.driver_id
            LEFT JOIN vehicles v ON d.driver_id = v.driver_id
            LEFT JOIN vehicle_categories vc ON v.category_id = vc.category_id
            WHERE 1=1
        `;

        const params = [];

        if (startDate) {
            query += ' AND d.created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND d.created_at <= ?';
            params.push(endDate + ' 23:59:59');
        }

        query += ' GROUP BY d.driver_id ORDER BY total_earnings DESC';

        const drivers = await executeQuery(query, params);

        // Calculate performance metrics
        const totalDrivers = drivers.length;
        const activeDrivers = drivers.filter(d => d.total_bookings > 0).length;
        const totalEarnings = drivers.reduce((sum, d) => sum + parseFloat(d.total_earnings || 0), 0);
        const totalBookings = drivers.reduce((sum, d) => sum + parseInt(d.total_bookings || 0), 0);

        res.json(formatResponse(true, 'Driver performance report generated successfully', {
            drivers: drivers,
            summary: {
                total_drivers: totalDrivers,
                active_drivers: activeDrivers,
                total_earnings: totalEarnings,
                total_bookings: totalBookings,
                avg_earnings_per_driver: totalDrivers > 0 ? totalEarnings / totalDrivers : 0,
                avg_bookings_per_driver: totalDrivers > 0 ? totalBookings / totalDrivers : 0
            }
        }));

    } catch (error) {
        console.error('Driver performance report error:', error);
        res.status(500).json(formatResponse(false, 'Failed to generate driver performance report'));
    }
});

// Popular Destinations Report
router.get('/reports/popular-destinations', async (req, res) => {
    try {
        const { format = 'json', startDate, endDate, limit = 10 } = req.query;

        // Get popular destinations from bookings
        let destinationQuery = `
            SELECT
                JSON_UNQUOTE(JSON_EXTRACT(destinations, '$[0]')) as destination,
                COUNT(*) as booking_count,
                SUM(total_cost) as total_revenue,
                AVG(total_cost) as avg_cost,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
                vc.category_name as popular_vehicle_category
            FROM bookings b
            LEFT JOIN vehicle_categories vc ON b.selected_category_id = vc.category_id
            WHERE JSON_LENGTH(destinations) > 0
        `;

        const params = [];

        if (startDate) {
            destinationQuery += ' AND b.created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            destinationQuery += ' AND b.created_at <= ?';
            params.push(endDate + ' 23:59:59');
        }

        destinationQuery += `
            GROUP BY destination, vc.category_name
            ORDER BY booking_count DESC, total_revenue DESC
            LIMIT ?
        `;
        params.push(parseInt(limit));

        const destinations = await executeQuery(destinationQuery, params);

        // Get pickup location statistics
        let pickupQuery = `
            SELECT
                pickup_location,
                COUNT(*) as pickup_count,
                SUM(total_cost) as total_revenue
            FROM bookings b
            WHERE pickup_location IS NOT NULL AND pickup_location != ''
        `;

        const pickupParams = [];

        if (startDate) {
            pickupQuery += ' AND b.created_at >= ?';
            pickupParams.push(startDate);
        }

        if (endDate) {
            pickupQuery += ' AND b.created_at <= ?';
            pickupParams.push(endDate + ' 23:59:59');
        }

        pickupQuery += ' GROUP BY pickup_location ORDER BY pickup_count DESC LIMIT ?';
        pickupParams.push(parseInt(limit));

        const pickupLocations = await executeQuery(pickupQuery, pickupParams);

        // Get route statistics (pickup -> destination combinations)
        let routeQuery = `
            SELECT
                pickup_location,
                JSON_UNQUOTE(JSON_EXTRACT(destinations, '$[0]')) as destination,
                COUNT(*) as route_count,
                SUM(total_cost) as route_revenue,
                AVG(distance_km) as avg_distance
            FROM bookings b
            WHERE pickup_location IS NOT NULL
            AND JSON_LENGTH(destinations) > 0
        `;

        const routeParams = [];

        if (startDate) {
            routeQuery += ' AND b.created_at >= ?';
            routeParams.push(startDate);
        }

        if (endDate) {
            routeQuery += ' AND b.created_at <= ?';
            routeParams.push(endDate + ' 23:59:59');
        }

        routeQuery += ' GROUP BY pickup_location, destination ORDER BY route_count DESC LIMIT ?';
        routeParams.push(parseInt(limit));

        const popularRoutes = await executeQuery(routeQuery, routeParams);

        res.json(formatResponse(true, 'Popular destinations report generated successfully', {
            popular_destinations: destinations,
            popular_pickup_locations: pickupLocations,
            popular_routes: popularRoutes,
            summary: {
                total_unique_destinations: destinations.length,
                total_bookings: destinations.reduce((sum, d) => sum + parseInt(d.booking_count || 0), 0),
                total_revenue: destinations.reduce((sum, d) => sum + parseFloat(d.total_revenue || 0), 0)
            }
        }));

    } catch (error) {
        console.error('Popular destinations report error:', error);
        res.status(500).json(formatResponse(false, 'Failed to generate popular destinations report'));
    }
});

// Revenue Report
router.get('/reports/revenue', async (req, res) => {
    try {
        const { format = 'json', startDate, endDate } = req.query;

        let query = `
            SELECT
                b.booking_id,
                b.created_at as booking_date,
                b.total_cost,
                ROUND(b.total_cost * 0.15, 2) as revenue,
                b.status,
                CONCAT(t.first_name, ' ', t.last_name) as tourist_name,
                CONCAT(d.first_name, ' ', d.last_name) as driver_name,
                vc.category_name as vehicle_category
            FROM bookings b
            LEFT JOIN tourists t ON b.tourist_id = t.tourist_id
            LEFT JOIN drivers d ON b.driver_id = d.driver_id
            LEFT JOIN vehicle_categories vc ON b.selected_category_id = vc.category_id
            WHERE 1=1
        `;

        const params = [];

        if (startDate) {
            query += ' AND DATE(b.created_at) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND DATE(b.created_at) <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY b.created_at DESC';

        const bookings = await executeQuery(query, params);

        // Calculate totals
        const totalBookings = bookings.length;
        const totalCost = bookings.reduce((sum, booking) => sum + parseFloat(booking.total_cost || 0), 0);
        const totalRevenue = bookings.reduce((sum, booking) => sum + parseFloat(booking.revenue || 0), 0);

        const summary = {
            total_bookings: totalBookings,
            total_cost: totalCost.toFixed(2),
            total_revenue: totalRevenue.toFixed(2),
            revenue_percentage: '15%',
            report_generated: new Date().toISOString()
        };

        if (format === 'pdf') {
            // Generate PDF
            const PDFDocument = require('pdfkit');
            const doc = new PDFDocument();

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="revenue-report.pdf"');

            doc.pipe(res);

            // PDF Header
            doc.fontSize(20).text('Siyoga Travels - Revenue Report', 50, 50);
            doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
            doc.text(`Report Period: ${startDate || 'All time'} to ${endDate || 'Present'}`, 50, 95);

            // Summary
            doc.fontSize(14).text('Summary', 50, 130);
            doc.fontSize(10)
               .text(`Total Bookings: ${summary.total_bookings}`, 50, 150)
               .text(`Total Cost: Rs. ${summary.total_cost}`, 50, 165)
               .text(`Total Revenue (15%): Rs. ${summary.total_revenue}`, 50, 180);

            // Table headers
            let yPosition = 220;
            doc.fontSize(8)
               .text('Booking ID', 50, yPosition)
               .text('Date', 120, yPosition)
               .text('Tourist', 180, yPosition)
               .text('Driver', 250, yPosition)
               .text('Vehicle', 320, yPosition)
               .text('Cost', 380, yPosition)
               .text('Revenue', 430, yPosition)
               .text('Status', 480, yPosition);

            yPosition += 20;

            // Table data
            bookings.forEach((booking, index) => {
                if (yPosition > 750) {
                    doc.addPage();
                    yPosition = 50;
                }

                doc.text(booking.booking_id.toString(), 50, yPosition)
                   .text(new Date(booking.booking_date).toLocaleDateString(), 120, yPosition)
                   .text((booking.tourist_name || 'N/A').substring(0, 15), 180, yPosition)
                   .text((booking.driver_name || 'N/A').substring(0, 15), 250, yPosition)
                   .text((booking.vehicle_category || 'N/A').substring(0, 12), 320, yPosition)
                   .text(`Rs. ${booking.total_cost}`, 380, yPosition)
                   .text(`Rs. ${booking.revenue}`, 430, yPosition)
                   .text(booking.status, 480, yPosition);

                yPosition += 15;
            });

            doc.end();
        } else {
            res.json(formatResponse(true, 'Revenue report generated successfully', {
                summary,
                bookings
            }));
        }

    } catch (error) {
        console.error('Revenue report error:', error);
        res.status(500).json(formatResponse(false, 'Failed to generate revenue report'));
    }
});

module.exports = router;
