/**
 * Vehicle utility functions and data for Siyoga Travel
 * Simple and clean implementation for vehicle selection and cost calculation
 */

// Vehicle categories with pricing and features
export const VEHICLE_CATEGORIES = [
  {
    id: 'cars',
    name: 'Cars',
    type: 'car',
    passengerCapacity: '1-4 passengers',
    minPassengers: 1,
    maxPassengers: 4,
    driverRate: 110,
    systemRate: 130,
    features: [
      'Fuel efficient',
      'Comfortable for small groups', 
      'Suitable for city travel',
      'Air Conditioning'
    ],
    examples: [
      'Toyota Corolla, Axio, Prius, Aqua, Vitz',
      'Suzuki Alto, Wagon R, Swift, Maruti, Celerio',
      'Honda Fit (Jazz), Grace',
      'Nissan Leaf, March, Sunny, X-Trail'
    ],
    description: 'Comfortable sedans suitable for small groups'
  },
  {
    id: 'kdh_flat_roof',
    name: 'KDH Flat Roof',
    type: 'van',
    passengerCapacity: '6-10 passengers',
    minPassengers: 6,
    maxPassengers: 10,
    driverRate: 125,
    systemRate: 145,
    features: [
      'Spacious interior',
      'Comfortable for long journeys',
      'Ample luggage space', 
      'Air Conditioning'
    ],
    examples: [
      'Toyota HiAce KDH',
      'Hyundai H1'
    ],
    description: 'Spacious vans ideal for medium-sized groups'
  },
  {
    id: 'kdh_high_roof',
    name: 'KDH High Roof',
    type: 'van', 
    passengerCapacity: '6-12 passengers',
    minPassengers: 6,
    maxPassengers: 12,
    driverRate: 135,
    systemRate: 160,
    features: [
      'Spacious interior',
      'Comfortable for long journeys',
      'Ample luggage space',
      'Air Conditioning'
    ],
    examples: [
      'Toyota HiAce KDH',
      'Hyundai H1'
    ],
    description: 'Spacious vans ideal for medium-sized groups'
  },
  {
    id: 'other_vans',
    name: 'Other Vans',
    type: 'van',
    passengerCapacity: '6-10 passengers', 
    minPassengers: 6,
    maxPassengers: 10,
    driverRate: 120,
    systemRate: 145,
    features: [
      'Spacious interior',
      'Comfortable for long journeys',
      'Ample luggage space',
      'Air Conditioning'
    ],
    examples: [
      'Toyota Noah, Vellfire, Alphard',
      'Suzuki Every',
      'Mercedes V-Class, Sprinter',
      'Nissan Caravan'
    ],
    description: 'Spacious vans ideal for medium-sized groups'
  },
  {
    id: 'mini_buses',
    name: 'Mini Buses',
    type: 'mini_bus',
    passengerCapacity: '12-25 passengers',
    minPassengers: 12,
    maxPassengers: 25,
    driverRate: 180,
    systemRate: 210,
    features: [
      'Large seating capacity',
      'Comfortable for group travel',
      'Spacious luggage area',
      'Air Conditioning'
    ],
    examples: [
      'Mitsubishi Rosa, Fuso Rosa',
      'Toyota Coaster',
      'Nissan Civilian',
      'Hyundai County'
    ],
    description: 'Large buses perfect for big groups and long trips'
  }
];

// Accommodation costs for drivers (when not provided by tourist)
export const ACCOMMODATION_COSTS = {
  1: 3000, // 1 night
  2: 5000, // 2 nights  
  3: 7000  // 3 nights
};

/**
 * Calculate trip cost based on distance and vehicle selection
 * @param {number} mapDistance - Original distance from Google Maps (km)
 * @param {string} vehicleId - Selected vehicle category ID
 * @param {number} tripDays - Number of days for the trip
 * @param {boolean} accommodationProvided - Whether tourist provides driver accommodation
 * @returns {Object} - Cost breakdown
 */
export const calculateTripCost = (mapDistance, vehicleId, tripDays = 1, accommodationProvided = true) => {
  try {
    // Find vehicle category
    const vehicle = VEHICLE_CATEGORIES.find(v => v.id === vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle category not found');
    }

    // Add 10km for practical purposes
    const practicalDistance = mapDistance + 10;
    
    // Round up to nearest 10km
    const roundedDistance = Math.ceil(practicalDistance / 10) * 10;
    
    // Calculate base trip cost
    const baseCost = roundedDistance * vehicle.systemRate;
    
    // Calculate accommodation cost if not provided
    let accommodationCost = 0;
    if (!accommodationProvided && tripDays > 1) {
      const nights = tripDays - 1;
      accommodationCost = ACCOMMODATION_COSTS[Math.min(nights, 3)] || (nights * 2500);
    }
    
    // Total cost
    const totalCost = baseCost + accommodationCost;
    
    return {
      success: true,
      mapDistance,
      practicalDistance,
      roundedDistance,
      vehicle: vehicle.name,
      ratePerKm: vehicle.systemRate,
      baseCost,
      accommodationCost,
      totalCost,
      breakdown: {
        distance: `${mapDistance} km (map) + 10 km (practical) = ${practicalDistance} km → ${roundedDistance} km (rounded)`,
        rate: `Rs. ${vehicle.systemRate} per km`,
        calculation: `${roundedDistance} km × Rs. ${vehicle.systemRate} = Rs. ${baseCost.toLocaleString()}`,
        accommodation: accommodationProvided ? 'Provided by tourist' : `Rs. ${accommodationCost.toLocaleString()} for ${tripDays - 1} night(s)`,
        total: `Rs. ${totalCost.toLocaleString()}`
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get suitable vehicle categories for passenger count
 * @param {number} passengerCount - Number of passengers
 * @returns {Array} - Suitable vehicle categories
 */
export const getSuitableVehicles = (passengerCount) => {
  return VEHICLE_CATEGORIES.filter(vehicle => 
    passengerCount >= vehicle.minPassengers && passengerCount <= vehicle.maxPassengers
  );
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
  return `Rs. ${amount.toLocaleString()}`;
};

export default {
  VEHICLE_CATEGORIES,
  ACCOMMODATION_COSTS,
  calculateTripCost,
  getSuitableVehicles,
  formatCurrency
};
