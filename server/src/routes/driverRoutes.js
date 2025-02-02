const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  addVehicle,
  getDriverVehicles,
  getAvailableBookings,
  getDriverBookings
} = require('../controllers/driverController');

/**
 * Driver Routes
 * Simple implementation for driver operations
 */

// Add vehicle (protected route)
router.post('/vehicles/add', authenticateToken, addVehicle);

// Get driver's vehicles (protected route)
router.get('/vehicles', authenticateToken, getDriverVehicles);

// Get available bookings for driver (protected route)
router.get('/bookings/available', authenticateToken, getAvailableBookings);

// Get driver's accepted bookings (protected route)
router.get('/bookings/my-bookings', authenticateToken, getDriverBookings);

module.exports = router;
