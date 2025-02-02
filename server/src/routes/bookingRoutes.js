const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createBooking,
  getVehicleCategories,
  getUserBookings,
  acceptBooking
} = require('../controllers/bookingController');

/**
 * Booking Routes
 * Simple and clean implementation for booking management
 */

// Get all vehicle categories (public route)
router.get('/vehicle-categories', getVehicleCategories);

// Create new booking (protected route)
router.post('/create', authenticateToken, createBooking);

// Get user's bookings (protected route)
router.get('/my-bookings', authenticateToken, getUserBookings);

// Accept booking (protected route for drivers)
router.put('/accept/:bookingId', authenticateToken, acceptBooking);

module.exports = router;
