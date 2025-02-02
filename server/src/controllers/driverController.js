const db = require('../config/database');

/**
 * Add vehicle for driver
 * Simple implementation for driver to add their vehicle
 */
const addVehicle = async (req, res) => {
  try {
    const {
      categoryId,
      makeModel,
      registrationNumber,
      yearManufactured,
      color,
      seatingCapacity,
      insuranceExpiry
    } = req.body;

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

    // Get vehicle category details to determine vehicle_type
    const [categoryResult] = await db.execute(
      'SELECT vehicle_type FROM vehicle_categories WHERE category_id = ?',
      [categoryId]
    );

    if (categoryResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle category not found'
      });
    }

    const vehicleType = categoryResult[0].vehicle_type;

    // Insert vehicle
    const [result] = await db.execute(`
      INSERT INTO vehicles (
        driver_id, category_id, vehicle_type, make_model, registration_number,
        year_manufactured, color, seating_capacity, insurance_expiry
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      driverId,
      categoryId,
      vehicleType,
      makeModel,
      registrationNumber,
      yearManufactured || null,
      color || null,
      seatingCapacity,
      insuranceExpiry
    ]);

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: {
        vehicleId: result.insertId,
        driverId,
        categoryId,
        vehicleType
      }
    });

  } catch (error) {
    console.error('Error adding vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add vehicle',
      error: error.message
    });
  }
};

/**
 * Get driver's vehicles
 * Simple implementation to fetch driver's vehicles
 */
const getDriverVehicles = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get driver_id
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

    // Get vehicles with category details
    const [vehicles] = await db.execute(`
      SELECT 
        v.*,
        vc.category_name,
        vc.driver_rate_per_km,
        vc.system_rate_per_km
      FROM vehicles v
      JOIN vehicle_categories vc ON v.category_id = vc.category_id
      WHERE v.driver_id = ? AND v.is_active = 1
      ORDER BY v.created_at DESC
    `, [driverId]);

    res.json({
      success: true,
      data: vehicles
    });

  } catch (error) {
    console.error('Error fetching driver vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles',
      error: error.message
    });
  }
};

/**
 * Get available bookings for driver
 * Simple implementation to show bookings matching driver's vehicle types
 */
const getAvailableBookings = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get driver_id
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

    // Get driver's vehicle categories
    const [driverCategories] = await db.execute(`
      SELECT DISTINCT v.category_id, vc.category_name, vc.vehicle_type
      FROM vehicles v
      JOIN vehicle_categories vc ON v.category_id = vc.category_id
      WHERE v.driver_id = ? AND v.is_active = 1
    `, [driverId]);

    if (driverCategories.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No vehicles registered. Please add vehicles to see available bookings.'
      });
    }

    // Get category IDs that driver can handle
    const categoryIds = driverCategories.map(cat => cat.category_id);
    const placeholders = categoryIds.map(() => '?').join(',');

    // Get available bookings matching driver's vehicle categories
    const [bookings] = await db.execute(`
      SELECT 
        b.*,
        vc.category_name,
        vc.vehicle_type,
        t.first_name as tourist_first_name,
        t.last_name as tourist_last_name,
        t.phone as tourist_phone
      FROM bookings b
      JOIN vehicle_categories vc ON b.selected_category_id = vc.category_id
      JOIN tourists t ON b.tourist_id = t.tourist_id
      WHERE b.selected_category_id IN (${placeholders})
      AND b.status = 'pending'
      AND b.driver_id IS NULL
      ORDER BY b.created_at DESC
    `, categoryIds);

    res.json({
      success: true,
      data: bookings,
      driverCategories: driverCategories
    });

  } catch (error) {
    console.error('Error fetching available bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available bookings',
      error: error.message
    });
  }
};

/**
 * Get driver's accepted bookings
 * Simple implementation to show driver's current bookings
 */
const getDriverBookings = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get driver_id
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

    // Get driver's bookings
    const [bookings] = await db.execute(`
      SELECT 
        b.*,
        vc.category_name,
        vc.vehicle_type,
        t.first_name as tourist_first_name,
        t.last_name as tourist_last_name,
        t.phone as tourist_phone
      FROM bookings b
      JOIN vehicle_categories vc ON b.selected_category_id = vc.category_id
      JOIN tourists t ON b.tourist_id = t.tourist_id
      WHERE b.driver_id = ?
      ORDER BY b.created_at DESC
    `, [driverId]);

    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('Error fetching driver bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver bookings',
      error: error.message
    });
  }
};

module.exports = {
  addVehicle,
  getDriverVehicles,
  getAvailableBookings,
  getDriverBookings
};
