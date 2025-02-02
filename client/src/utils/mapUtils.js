/**
 * Map utility functions for trip planning with Google Maps API
 * Clean and simple implementation for Siyoga Travel
 */

// Sri Lanka coordinates
export const SRI_LANKA_CENTER = { lat: 7.8731, lng: 80.7718 };

// Google Maps API key (using GoMaps.pro for free tier)
export const GOOGLE_MAPS_API_KEY = "AlzaSyiDEaUjW-MreVKn_7pW3N5QavKJqVUbGaX";
export const GOMAPS_API_KEY = GOOGLE_MAPS_API_KEY; // Alias for compatibility

// Google Maps API URL with callback (matching Real Project format)
export const GOOGLE_MAPS_API_URL = `https://maps.gomaps.pro/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,drawing&callback=initAutocomplete`;

// Popular Sri Lankan destinations with coordinates
export const SRI_LANKA_DESTINATIONS = {
  'Colombo': { lat: 6.9271, lng: 79.8612 },
  'Kandy': { lat: 7.2906, lng: 80.6337 },
  'Galle': { lat: 6.0535, lng: 80.2210 },
  'Sigiriya': { lat: 7.9570, lng: 80.7603 },
  'Ella': { lat: 6.8667, lng: 81.0466 },
  'Nuwara Eliya': { lat: 6.9497, lng: 80.7891 },
  'Yala National Park': { lat: 6.3698, lng: 81.5046 },
  'Anuradhapura': { lat: 8.3114, lng: 80.4037 },
  'Jaffna': { lat: 9.6615, lng: 80.0255 },
  'Trincomalee': { lat: 8.5874, lng: 81.2152 },
  'Mirissa': { lat: 5.9483, lng: 80.4589 },
  'Bentota': { lat: 6.4213, lng: 79.9959 },
  'Negombo': { lat: 7.2081, lng: 79.8371 },
  'Dambulla': { lat: 7.8675, lng: 80.6518 },
  'Adams Peak': { lat: 6.8096, lng: 80.4994 }
};

/**
 * Calculate distance between multiple locations using Google Maps Distance Matrix API
 * @param {Array} locations - Array of location addresses [origin, dest1, dest2, ...]
 * @param {Object} options - Additional options
 * @returns {Promise} - Promise that resolves with distance details
 */
export const calculateRouteDistance = async (locations, options = {}) => {
  try {
    const {
      isReturnTrip = false,
      startTime = '09:00',
      additionalStopTime = 3 // hours
    } = options;

    if (!locations || locations.length < 2) {
      return {
        success: false,
        error: 'At least origin and one destination are required'
      };
    }

    // Create route array
    let routeLocations = [...locations];
    
    // For return trips, add origin as final destination
    if (isReturnTrip) {
      routeLocations.push(locations[0]);
    }

    console.log('Calculating route for:', routeLocations);

    // Calculate distances for each segment
    const segments = [];
    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 0; i < routeLocations.length - 1; i++) {
      const origin = routeLocations[i];
      const destination = routeLocations[i + 1];
      
      const segmentResult = await calculateSegmentDistance(origin, destination);
      
      if (!segmentResult.success) {
        return segmentResult;
      }
      
      segments.push({
        from: origin,
        to: destination,
        distance: segmentResult.distance,
        duration: segmentResult.duration,
        index: i + 1
      });
      
      totalDistance += segmentResult.distance.value;
      totalDuration += segmentResult.duration.value;
      
      // Add stop time for intermediate destinations
      if (i < routeLocations.length - 2) {
        totalDuration += additionalStopTime * 3600; // Convert hours to seconds
      }
    }

    // Convert to readable format
    const totalDistanceKm = Math.round(totalDistance / 1000);
    const totalDurationHours = totalDuration / 3600;
    
    // Calculate trip details
    const tripDetails = calculateTripDetails(totalDurationHours, startTime);
    
    return {
      success: true,
      totalDistance: totalDistanceKm,
      totalDuration: totalDurationHours,
      segments,
      tripDetails,
      breakdown: {
        segments: segments.map(seg => ({
          from: seg.from,
          to: seg.to,
          distance: `${Math.round(seg.distance.value / 1000)} km`,
          duration: `${Math.round(seg.duration.value / 60)} mins`
        })),
        totalDistance: `${totalDistanceKm} km`,
        totalDuration: formatDuration(totalDurationHours),
        tripType: isReturnTrip ? 'Return Trip' : 'One-way Trip'
      },
      feasibility: {
        tripType: isReturnTrip ? 'Return Trip' : 'One-way Trip',
        distance: `${totalDistanceKm} km`,
        drivingTime: formatDuration(totalDuration / 3600 - additionalStopTime * (segments.length - 1)),
        stopTime: segments.length > 1 ? `${additionalStopTime * (segments.length - 1)} hours` : 'No stops',
        totalDuration: formatDuration(totalDurationHours)
      },
      schedule: {
        startTime,
        estimatedEndTime: calculateEndTime(startTime, totalDurationHours),
        daysNeeded: tripDetails.daysNeeded
      }
    };

  } catch (error) {
    console.error('Error calculating route distance:', error);
    return {
      success: false,
      error: 'Failed to calculate route distance. Please try again.'
    };
  }
};

/**
 * Calculate distance between two locations using Google Maps Distance Matrix API
 * @param {string} origin - Origin address
 * @param {string} destination - Destination address
 * @returns {Promise} - Promise that resolves with distance details
 */
const calculateSegmentDistance = async (origin, destination) => {
  try {
    const url = `https://maps.gomaps.pro/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
    
    console.log(`Calculating distance: ${origin} → ${destination}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
      const element = data.rows[0].elements[0];
      
      return {
        success: true,
        distance: element.distance,
        duration: element.duration,
        originAddress: data.origin_addresses[0],
        destinationAddress: data.destination_addresses[0]
      };
    } else {
      console.error('Distance Matrix API error:', data);
      return {
        success: false,
        error: `Failed to calculate distance between ${origin} and ${destination}`
      };
    }
  } catch (error) {
    console.error('Error fetching distance:', error);
    return {
      success: false,
      error: 'Network error while calculating distance'
    };
  }
};

/**
 * Calculate trip details based on duration
 * @param {number} totalHours - Total trip duration in hours
 * @param {string} startTime - Start time in HH:MM format
 * @returns {Object} - Trip details
 */
const calculateTripDetails = (totalHours, startTime) => {
  const daysNeeded = totalHours > 12 ? Math.ceil(totalHours / 12) : 1;
  const endTime = calculateEndTime(startTime, totalHours);
  
  return {
    daysNeeded,
    endTime,
    feasible: totalHours <= 24, // Trips over 24 hours need special planning
    recommendation: totalHours > 12 ? 
      'This trip will require overnight accommodation' : 
      'This trip can be completed in one day'
  };
};

/**
 * Calculate end time based on start time and duration
 * @param {string} startTime - Start time in HH:MM format
 * @param {number} durationHours - Duration in hours
 * @returns {string} - End time in HH:MM format
 */
const calculateEndTime = (startTime, durationHours) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + (durationHours * 60);
  
  const endHours = Math.floor(endMinutes / 60) % 24;
  const endMins = Math.round(endMinutes % 60);
  
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
};

/**
 * Format duration from hours to readable string
 * @param {number} hours - Duration in hours
 * @returns {string} - Formatted duration
 */
const formatDuration = (hours) => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (wholeHours > 0 && minutes > 0) {
    return `${wholeHours} hours ${minutes} mins`;
  } else if (wholeHours > 0) {
    return `${wholeHours} hours`;
  } else {
    return `${minutes} mins`;
  }
};

/**
 * Load Google Maps API script with callback approach (matching Real Project)
 * @returns {Promise} - Promise that resolves when API is loaded
 */
export const loadGoogleMapsAPI = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve();
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector(`script[src*="maps.gomaps.pro"]`);
    if (existingScript) {
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkGoogleMaps);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkGoogleMaps);
        reject(new Error('Timeout waiting for Google Maps API'));
      }, 10000);

      return;
    }

    // Set up global callback
    const originalInitAutocomplete = window.initAutocomplete;
    window.initAutocomplete = () => {
      console.log("Google Maps API loaded via callback");
      resolve();

      // Call original callback if it exists
      if (originalInitAutocomplete && typeof originalInitAutocomplete === 'function') {
        originalInitAutocomplete();
      }
    };

    const script = document.createElement('script');
    script.src = GOOGLE_MAPS_API_URL;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API script'));
    };

    document.head.appendChild(script);
  });
};

export default {
  calculateRouteDistance,
  loadGoogleMapsAPI,
  SRI_LANKA_CENTER,
  SRI_LANKA_DESTINATIONS
};
