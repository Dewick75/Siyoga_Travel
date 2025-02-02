import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateRouteDistance, loadGoogleMapsAPI, GOMAPS_API_KEY } from '../utils/mapUtils';
import { toast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import VehicleSelection from '../components/VehicleSelection';
import TripCostSummary from '../components/TripCostSummary';

function TripPlanner() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [tripData, setTripData] = useState({
    startDate: '',
    startTime: '09:00',
    travelers: 2,
    tripType: 'one-way',
    pickupLocation: '',
    destinations: [''],
    finalDestination: ''
  });
  const [tripCalculation, setTripCalculation] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Vehicle selection state
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [costBreakdown, setCostBreakdown] = useState(null);

  // Google Maps autocomplete state
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const pickupInputRef = useRef(null);
  const destinationInputRefs = useRef([]);
  const [selectedPlaces, setSelectedPlaces] = useState({
    pickup: null,
    destinations: []
  });

  // Initialize Google Maps API and autocomplete
  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        await loadGoogleMapsAPI();
        setGoogleMapsLoaded(true);
        console.log('Google Maps API loaded successfully');
      } catch (error) {
        console.error('Failed to load Google Maps API:', error);
        toast.error('Failed to load Google Maps. Autocomplete may not work.');
      }
    };

    initializeGoogleMaps();
  }, []);

  // Initialize autocomplete when Google Maps is loaded
  useEffect(() => {
    if (googleMapsLoaded && window.google && window.google.maps && window.google.maps.places) {
      initializeAutocomplete();
    }
  }, [googleMapsLoaded, tripData.destinations.length]);

  const initializeAutocomplete = useCallback(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) return;

    // Initialize pickup location autocomplete
    if (pickupInputRef.current) {
      const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupInputRef.current, {
        componentRestrictions: { country: 'lk' }, // Restrict to Sri Lanka
        fields: ['address_components', 'geometry', 'name', 'formatted_address', 'place_id'],
        types: ['geocode', 'establishment']
      });

      pickupAutocomplete.addListener('place_changed', () => {
        const place = pickupAutocomplete.getPlace();
        if (place && place.formatted_address) {
          setTripData(prev => ({ ...prev, pickupLocation: place.formatted_address }));
          setSelectedPlaces(prev => ({ ...prev, pickup: place }));
          console.log('Pickup location selected:', place.formatted_address);
        }
      });
    }

    // Initialize destination autocompletes
    destinationInputRefs.current.forEach((inputRef, index) => {
      if (inputRef) {
        const destAutocomplete = new window.google.maps.places.Autocomplete(inputRef, {
          componentRestrictions: { country: 'lk' }, // Restrict to Sri Lanka
          fields: ['address_components', 'geometry', 'name', 'formatted_address', 'place_id'],
          types: ['geocode', 'establishment']
        });

        destAutocomplete.addListener('place_changed', () => {
          const place = destAutocomplete.getPlace();
          if (place && place.formatted_address) {
            updateDestination(index, place.formatted_address);
            setSelectedPlaces(prev => {
              const newDestinations = [...prev.destinations];
              newDestinations[index] = place;
              return { ...prev, destinations: newDestinations };
            });
            console.log(`Destination ${index + 1} selected:`, place.formatted_address);
          }
        });
      }
    });
  }, []);

  const handleInputChange = (field, value) => {
    setTripData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addDestination = () => {
    setTripData(prev => ({
      ...prev,
      destinations: [...prev.destinations, '']
    }));
    // Expand refs array for new destination
    destinationInputRefs.current.push(null);
  };

  const updateDestination = (index, value) => {
    setTripData(prev => ({
      ...prev,
      destinations: prev.destinations.map((dest, i) => i === index ? value : dest)
    }));
  };

  const removeDestination = (index) => {
    setTripData(prev => ({
      ...prev,
      destinations: prev.destinations.filter((_, i) => i !== index)
    }));
    // Remove from refs array
    destinationInputRefs.current.splice(index, 1);
    // Remove from selected places
    setSelectedPlaces(prev => ({
      ...prev,
      destinations: prev.destinations.filter((_, i) => i !== index)
    }));
  };

  const calculateRoute = async () => {
    // Validate inputs
    if (!tripData.pickupLocation.trim()) {
      toast.error('Please enter a pickup location');
      return;
    }

    if (!tripData.destinations[0] || !tripData.destinations[0].trim()) {
      toast.error('Please enter at least one destination');
      return;
    }

    if (!tripData.startDate) {
      toast.error('Please select a start date');
      return;
    }

    setCalculating(true);

    try {
      // Prepare locations array for calculation
      const locations = [tripData.pickupLocation];

      // Add valid destinations
      const validDestinations = tripData.destinations.filter(dest => dest && dest.trim());
      locations.push(...validDestinations);

      // Add final destination if different and specified
      if (tripData.finalDestination && tripData.finalDestination.trim() &&
          tripData.finalDestination !== validDestinations[validDestinations.length - 1]) {
        locations.push(tripData.finalDestination);
      }

      console.log('Calculating route for locations:', locations);

      // Calculate actual distances using Google Maps API
      const result = await calculateRouteDistance(locations, {
        isReturnTrip: tripData.tripType === 'return',
        startTime: tripData.startTime,
        additionalStopTime: 3 // 3 hours stop time
      });

      if (result.success) {
        setTripCalculation(result);
        setCurrentStep(2);
        toast.success('Route calculated successfully!');
      } else {
        toast.error(result.error || 'Failed to calculate route');
      }

    } catch (error) {
      console.error('Error calculating route:', error);
      toast.error('An error occurred while calculating the route');
    } finally {
      setCalculating(false);
    }
  };

  const calculateEndTime = (startTime, durationHours) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + (durationHours * 60);
    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = Math.round(endMinutes % 60);
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const proceedToVehicleSelection = () => {
    setCurrentStep(3);
  };

  const handleVehicleSelect = useCallback((vehicle) => {
    setSelectedVehicle(vehicle);
  }, []);

  const handleCostCalculate = useCallback((cost) => {
    setCostBreakdown(cost);
  }, []);

  const proceedToBooking = async () => {
    if (!selectedVehicle || !costBreakdown) {
      toast.error('Please select a vehicle first');
      return;
    }

    try {
      // Get the vehicle category ID (we'll use a simple mapping for now)
      const categoryMapping = {
        'cars': 1,
        'kdh_flat_roof': 2,
        'kdh_high_roof': 3,
        'other_vans': 4,
        'mini_buses': 5
      };

      const selectedCategoryId = categoryMapping[selectedVehicle.id];
      if (!selectedCategoryId) {
        toast.error('Invalid vehicle category selected');
        return;
      }

      // Prepare booking data for backend
      const bookingData = {
        pickupLocation: tripData.pickupLocation,
        destinations: tripData.destinations.filter(dest => dest.trim() !== ''),
        tripType: tripData.tripType,
        startDate: tripData.startDate,
        startTime: tripData.startTime,
        travelersCount: tripData.travelers,
        selectedCategoryId: selectedCategoryId,
        totalDistanceKm: costBreakdown.roundedDistance,
        calculatedDistanceKm: costBreakdown.mapDistance,
        tripCost: costBreakdown.baseCost,
        accommodationCost: costBreakdown.accommodationCost,
        totalCost: costBreakdown.totalCost,
        driverAccommodationProvided: costBreakdown.accommodationCost === 0,
        tripDurationDays: tripCalculation?.schedule?.daysNeeded || 1,
        specialRequirements: null
      };

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to create a booking');
        navigate('/login');
        return;
      }

      // Send booking to backend
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Booking created successfully! ${result.data.driversNotified} drivers notified.`);
        setCurrentStep(4);
      } else {
        toast.error(result.message || 'Failed to create booking');
      }

    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '10px',
        padding: '30px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '20px'
        }}>
          <h1 style={{ color: '#333', margin: 0 }}>Plan Your Trip</h1>
          <button
            onClick={goBack}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Back
          </button>
        </div>

        <p style={{ color: '#666', marginBottom: '30px' }}>
          Plan your perfect Sri Lankan adventure with our comprehensive trip planner.
        </p>

        {/* Progress Steps */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '40px',
          gap: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: currentStep >= 1 ? '#667eea' : '#ccc',
            fontWeight: currentStep === 1 ? 'bold' : 'normal'
          }}>
            <span style={{
              background: currentStep >= 1 ? '#667eea' : '#ccc',
              color: 'white',
              borderRadius: '50%',
              width: '25px',
              height: '25px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '8px',
              fontSize: '12px'
            }}>1</span>
            Plan Trip
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: currentStep >= 2 ? '#667eea' : '#ccc',
            fontWeight: currentStep === 2 ? 'bold' : 'normal'
          }}>
            <span style={{
              background: currentStep >= 2 ? '#667eea' : '#ccc',
              color: 'white',
              borderRadius: '50%',
              width: '25px',
              height: '25px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '8px',
              fontSize: '12px'
            }}>2</span>
            Route Planning
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: currentStep >= 3 ? '#667eea' : '#ccc',
            fontWeight: currentStep === 3 ? 'bold' : 'normal'
          }}>
            <span style={{
              background: currentStep >= 3 ? '#667eea' : '#ccc',
              color: 'white',
              borderRadius: '50%',
              width: '25px',
              height: '25px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '8px',
              fontSize: '12px'
            }}>3</span>
            Vehicle Selection
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: currentStep >= 4 ? '#667eea' : '#ccc',
            fontWeight: currentStep === 4 ? 'bold' : 'normal'
          }}>
            <span style={{
              background: currentStep >= 4 ? '#667eea' : '#ccc',
              color: 'white',
              borderRadius: '50%',
              width: '25px',
              height: '25px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '8px',
              fontSize: '12px'
            }}>4</span>
            Booking Confirmation
          </div>
        </div>

        {/* Step 1: Trip Planning */}
        {currentStep === 1 && (
          <div>
            {calculating && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <LoadingSpinner message="Calculating route using Google Maps..." size="large" />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            {/* Trip Details */}
            <div>
              <h3 style={{ color: '#333', marginBottom: '20px' }}>Trip Details</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={tripData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  Start Time
                </label>
                <input
                  type="time"
                  value={tripData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  Number of Travelers
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={tripData.travelers}
                  onChange={(e) => handleInputChange('travelers', parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  Trip Type
                </label>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="tripType"
                      value="one-way"
                      checked={tripData.tripType === 'one-way'}
                      onChange={(e) => handleInputChange('tripType', e.target.value)}
                      style={{ marginRight: '8px' }}
                    />
                    One-way Trip
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="tripType"
                      value="return"
                      checked={tripData.tripType === 'return'}
                      onChange={(e) => handleInputChange('tripType', e.target.value)}
                      style={{ marginRight: '8px' }}
                    />
                    Return Trip
                  </label>
                </div>
                <p style={{ color: '#666', fontSize: '12px', margin: '5px 0 0 0' }}>
                  One-way trip ending at the final destination
                </p>
              </div>
            </div>

            {/* Route Planning */}
            <div>
              <h3 style={{ color: '#333', marginBottom: '20px' }}>Route Planning</h3>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  Pickup Location (Origin)
                </label>
                <input
                  ref={pickupInputRef}
                  type="text"
                  placeholder="Enter pickup location (autocomplete enabled)"
                  value={tripData.pickupLocation}
                  onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                {googleMapsLoaded && (
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    🗺️ Google Maps autocomplete enabled - start typing to see suggestions
                  </p>
                )}
              </div>

              {tripData.destinations.map((destination, index) => (
                <div key={index} style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                    Destination {index + 1}
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      ref={(el) => destinationInputRefs.current[index] = el}
                      type="text"
                      placeholder="Enter destination (autocomplete enabled)"
                      value={destination}
                      onChange={(e) => updateDestination(index, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                    {tripData.destinations.length > 1 && (
                      <button
                        onClick={() => removeDestination(index)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '12px',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={addDestination}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}
              >
                + Add Destination
              </button>

              {/* <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  Final Destination (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter final destination (if different from last waypoint)"
                  value={tripData.finalDestination}
                  onChange={(e) => handleInputChange('finalDestination', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div> */}

              {/* Debug Information */}
              {/* <div style={{
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px',
                fontSize: '12px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🔧 Debug Information</h4>
                <div style={{ color: '#6c757d' }}>
                  <div>Google Maps API Status: {googleMapsLoaded ? '✅ Loaded' : '⏳ Loading...'}</div>
                  <div>Places API: {window.google?.maps?.places ? '✅ Available' : '❌ Not Available'}</div>
                  <div>API Key: {GOMAPS_API_KEY ? '✅ Configured' : '❌ Missing'}</div>
                  <div>Selected Places: Pickup: {selectedPlaces.pickup ? '✅' : '❌'}, Destinations: {selectedPlaces.destinations.length}</div>
                </div>
              </div> */}

              <button
                onClick={calculateRoute}
                disabled={calculating}
                style={{
                  width: '100%',
                  background: calculating ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '15px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: calculating ? 'not-allowed' : 'pointer',
                  opacity: calculating ? 0.7 : 1
                }}
              >
                {calculating ? '🔄 Calculating...' : '🧮 Calculate Route'}
              </button>
            </div>
            </div>
          </div>
        )}

        {/* Step 2: Trip Calculation Results */}
        {currentStep === 2 && tripCalculation && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '30px' }}>Trip Calculation</h2>
            
            {/* Trip Type and Summary */}
            <div style={{
              background: '#e3f2fd',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '30px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ color: '#1976d2', margin: '0 0 10px 0' }}>
                  Trip Type: {tripCalculation.breakdown.tripType}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#333' }}>Total Distance</strong>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                    {tripCalculation.breakdown.totalDistance}
                  </div>
                </div>
                <div>
                  <strong style={{ color: '#333' }}>Total Duration</strong>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                    {tripCalculation.breakdown.totalDuration}
                  </div>
                </div>
              </div>
            </div>

            {/* Distance Calculation Breakdown */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>Distance Calculation Breakdown</h3>
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ marginBottom: '15px' }}>
                  <strong>Distance Calculation Breakdown:</strong>
                </div>
                {tripCalculation.breakdown.segments.map((segment, index) => (
                  <div key={index} style={{ marginBottom: '10px' }}>
                    <div>Segment {index + 1}: {segment.from} → {segment.to}</div>
                    <div>Distance: {segment.distance}</div>
                    <div>Duration: {segment.duration}</div>
                  </div>
                ))}
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
                  <div><strong>Total Distance: {tripCalculation.breakdown.totalDistance}</strong></div>
                  <div><strong>Total Duration: {tripCalculation.breakdown.totalDuration}</strong></div>
                  <div><strong>Trip Type: {tripCalculation.breakdown.tripType}</strong></div>
                </div>
              </div>
            </div>

            {/* Trip Feasibility Analysis */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>Trip Feasibility Analysis</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
              }}>
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>Trip Type</div>
                  <div style={{ color: '#667eea', fontWeight: 'bold' }}>{tripCalculation.feasibility.tripType}</div>
                </div>
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>Distance</div>
                  <div style={{ color: '#667eea', fontWeight: 'bold' }}>{tripCalculation.feasibility.distance}</div>
                </div>
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>Driving Time</div>
                  <div style={{ color: '#667eea', fontWeight: 'bold' }}>{tripCalculation.feasibility.drivingTime}</div>
                </div>
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>Stop Time</div>
                  <div style={{ color: '#667eea', fontWeight: 'bold' }}>{tripCalculation.feasibility.stopTime}</div>
                </div>
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>Total Trip Duration</div>
                  <div style={{ color: '#667eea', fontWeight: 'bold' }}>{tripCalculation.feasibility.totalDuration}</div>
                </div>
              </div>
            </div>

            {/* Trip Schedule */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>Trip Schedule</h3>
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '20px'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>Start Time</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>
                      {tripCalculation.schedule.startTime}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>Estimated End Time</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>
                      {tripCalculation.schedule.estimatedEndTime}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>Days Needed</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>
                      {tripCalculation.schedule.daysNeeded}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={proceedToVehicleSelection}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '15px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Continue to Vehicle Selection →
            </button>
          </div>
        )}

        {/* Step 3: Vehicle Selection */}
        {currentStep === 3 && (
          <div>
            <VehicleSelection
              tripData={tripData}
              tripCalculation={tripCalculation}
              onVehicleSelect={handleVehicleSelect}
              onCostCalculate={handleCostCalculate}
              selectedVehicle={selectedVehicle}
              costBreakdown={costBreakdown}
            />

            {selectedVehicle && costBreakdown && (
              <TripCostSummary
                tripCalculation={tripCalculation}
                selectedVehicle={selectedVehicle}
                costBreakdown={costBreakdown}
                onProceedToBooking={proceedToBooking}
              />
            )}

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button
                onClick={goBack}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '25px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                ← Back to Route Planning
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Booking Confirmation */}
        {currentStep === 4 && (
          <div style={{
            textAlign: 'center',
            padding: '50px',
            background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
            borderRadius: '15px',
            border: '2px solid #28a745'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
            <h2 style={{ color: '#155724', marginBottom: '20px' }}>Booking Request Submitted!</h2>
            <p style={{ color: '#155724', marginBottom: '30px', fontSize: '16px' }}>
              Your trip booking request has been prepared successfully.<br />
              Drivers with matching vehicles will be notified about your trip.
            </p>

            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '30px',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto 30px'
            }}>
              <h4 style={{ color: '#333', marginBottom: '15px' }}>📋 Booking Summary</h4>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <div><strong>Vehicle:</strong> {selectedVehicle?.name}</div>
                <div><strong>Distance:</strong> {costBreakdown?.roundedDistance} km</div>
                <div><strong>Total Cost:</strong> Rs. {costBreakdown?.totalCost.toLocaleString()}</div>
                <div><strong>Advance Payment:</strong> Rs. {(costBreakdown?.totalCost * 0.5).toLocaleString()}</div>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '15px 40px',
                borderRadius: '25px',
                fontSize: '16px',
                cursor: 'pointer',
                marginRight: '15px'
              }}
            >
              Go to Dashboard
            </button>

            <button
              onClick={() => {
                setCurrentStep(1);
                setSelectedVehicle(null);
                setCostBreakdown(null);
                setTripCalculation(null);
              }}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '15px 40px',
                borderRadius: '25px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Plan Another Trip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripPlanner;
