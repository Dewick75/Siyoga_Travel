const db = require('../config/database');
const { sendEmail } = require('../services/emailService');

/**
 * Create a new booking
 * Simple implementation for booking creation
 */
const createBooking = async (req, res) => {
  try {
    const {
      pickupLocation,
      destinations,
      tripType,
      startDate,
      startTime,
      travelersCount,
      selectedCategoryId,
      totalDistanceKm,
      calculatedDistanceKm,
      tripCost,
      accommodationCost,
      totalCost,
      driverAccommodationProvided,
      tripDurationDays,
      specialRequirements
    } = req.body;

    const userId = req.user.user_id;

    // Get tourist_id from users table
    const [touristResult] = await db.execute(
      'SELECT tourist_id FROM tourists WHERE user_id = ?',
      [userId]
    );

    if (touristResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tourist profile not found'
      });
    }

    const touristId = touristResult[0].tourist_id;

    // Insert booking into database
    const [result] = await db.execute(`
      INSERT INTO bookings (
        tourist_id, pickup_location, destinations, trip_type, start_date, start_time,
        travelers_count, selected_category_id, total_distance_km, calculated_distance_km,
        trip_cost, accommodation_cost, total_cost, driver_accommodation_provided,
        trip_duration_days, special_requirements, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      touristId,
      pickupLocation,
      JSON.stringify(destinations),
      tripType,
      startDate,
      startTime,
      travelersCount,
      selectedCategoryId,
      totalDistanceKm,
      calculatedDistanceKm,
      tripCost,
      accommodationCost || 0,
      totalCost,
      driverAccommodationProvided,
      tripDurationDays || 1,
      specialRequirements || null
    ]);

    const bookingId = result.insertId;

    // Get vehicle category details
    const [categoryResult] = await db.execute(
      'SELECT * FROM vehicle_categories WHERE category_id = ?',
      [selectedCategoryId]
    );

    if (categoryResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle category not found'
      });
    }

    const vehicleCategory = categoryResult[0];

    // TODO: Implement driver notification system when driver/vehicle tables are ready
    console.log(`Booking created successfully for category: ${vehicleCategory.category_name}`);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId,
        driversNotified: 0, // TODO: Implement driver notification
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

/**
 * Get vehicle categories
 * Simple implementation to fetch all active vehicle categories
 */
const getVehicleCategories = async (req, res) => {
  try {
    const [categories] = await db.execute(`
      SELECT * FROM vehicle_categories 
      WHERE is_active = 1 
      ORDER BY vehicle_type, category_name
    `);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching vehicle categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle categories',
      error: error.message
    });
  }
};

/**
 * Get user's bookings
 * Simple implementation to fetch tourist's bookings
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get tourist_id
    const [touristResult] = await db.execute(
      'SELECT tourist_id FROM tourists WHERE user_id = ?',
      [userId]
    );

    if (touristResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tourist profile not found'
      });
    }

    const touristId = touristResult[0].tourist_id;

    // Get bookings with vehicle category details
    const [bookings] = await db.execute(`
      SELECT
        b.*,
        vc.category_name,
        vc.vehicle_type,
        d.first_name as driver_first_name,
        d.last_name as driver_last_name,
        d.phone as driver_phone
      FROM bookings b
      JOIN vehicle_categories vc ON b.selected_category_id = vc.category_id
      LEFT JOIN drivers d ON b.driver_id = d.driver_id
      WHERE b.tourist_id = ?
      ORDER BY b.created_at DESC
    `, [touristId]);

    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

/**
 * Accept booking by driver
 * Simple implementation for driver to accept a booking
 */
const acceptBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.user_id;

    // Get driver_id from user_id
    const [driverResult] = await db.execute(
      'SELECT driver_id FROM drivers WHERE user_id = ?',
      [userId]
    );

    if (driverResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    const driverId = driverResult[0].driver_id;

    // Update booking with driver assignment
    const [result] = await db.execute(`
      UPDATE bookings
      SET driver_id = ?, status = 'confirmed'
      WHERE booking_id = ? AND status = 'pending'
    `, [driverId, bookingId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or already accepted'
      });
    }

    res.json({
      success: true,
      message: 'Booking accepted successfully',
      data: {
        bookingId,
        driverId,
        status: 'confirmed'
      }
    });

  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept booking',
      error: error.message
    });
  }
};

module.exports = {
  createBooking,
  getVehicleCategories,
  getUserBookings,
  acceptBooking
};
