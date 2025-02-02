// Main server file for Siyoga Travel Booking System
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database connection
const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookingRoutes');
const driverRoutes = require('./routes/driverRoutes');
const adminRoutes = require('./routes/admin');

// Create Express app
const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Siyoga Travel Booking API is running',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to Siyoga Travel Booking API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth/*',
            tourists: '/api/tourists/*',
            drivers: '/api/drivers/*',
            trips: '/api/trips/*',
            bookings: '/api/bookings/*'
        }
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.log('⚠️  Starting server without database connection');
        }
        
        // Start the server
        app.listen(PORT, () => {
            console.log('🚀 ================================');
            console.log(`🚀 Siyoga Travel Booking Server`);
            console.log(`🚀 Environment: ${process.env.NODE_ENV}`);
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🚀 API URL: http://localhost:${PORT}/api`);
            console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
            console.log('🚀 ================================');
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err.message);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    process.exit(1);
});

// Start the server
startServer();

module.exports = app;
