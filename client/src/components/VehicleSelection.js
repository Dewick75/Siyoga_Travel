import React, { useState, useEffect } from 'react';
import { VEHICLE_CATEGORIES, calculateTripCost, getSuitableVehicles, formatCurrency } from '../utils/vehicleUtils';

function VehicleSelection({ 
  tripData, 
  tripCalculation, 
  onVehicleSelect, 
  onCostCalculate,
  selectedVehicle,
  costBreakdown 
}) {
  const [passengerCount, setPassengerCount] = useState(tripData?.travelers || 2);
  const [acPreference, setAcPreference] = useState('ac');
  const [accommodationProvided, setAccommodationProvided] = useState(true);
  const [suitableVehicles, setSuitableVehicles] = useState([]);

  // Update suitable vehicles when passenger count changes
  useEffect(() => {
    const suitable = getSuitableVehicles(passengerCount);
    setSuitableVehicles(suitable);

    // Clear selection if current vehicle is no longer suitable
    if (selectedVehicle && !suitable.find(v => v.id === selectedVehicle.id)) {
      onVehicleSelect(null);
      onCostCalculate(null);
    }
  }, [passengerCount, selectedVehicle]);

  // Calculate cost when vehicle is selected
  useEffect(() => {
    if (selectedVehicle && tripCalculation) {
      const tripDays = tripCalculation.schedule?.daysNeeded || 1;
      const cost = calculateTripCost(
        tripCalculation.totalDistance,
        selectedVehicle.id,
        tripDays,
        accommodationProvided
      );
      onCostCalculate(cost);
    }
  }, [selectedVehicle, tripCalculation, accommodationProvided, onCostCalculate]);

  const handleVehicleSelect = (vehicle) => {
    onVehicleSelect(vehicle);
  };

  const VehicleCard = ({ vehicle, isSelected }) => (
    <div
      style={{
        border: isSelected ? '3px solid #667eea' : '2px solid #ddd',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '15px',
        background: isSelected ? '#f8f9ff' : 'white',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: isSelected ? '0 4px 12px rgba(102, 126, 234, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
      }}
      onClick={() => handleVehicleSelect(vehicle)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            color: '#333', 
            marginBottom: '8px',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            {vehicle.name}
          </h3>
          
          <p style={{ 
            color: '#666', 
            marginBottom: '12px',
            fontSize: '14px'
          }}>
            {vehicle.description}
          </p>

          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#333' }}>Examples:</strong>
            {vehicle.examples.map((example, index) => (
              <div key={index} style={{ 
                fontSize: '13px', 
                color: '#666',
                marginLeft: '10px'
              }}>
                • {example}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#333' }}>Features:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              {vehicle.features.map((feature, index) => (
                <span key={index} style={{
                  background: '#e9ecef',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#495057'
                }}>
                  ✓ {feature}
                </span>
              ))}
            </div>
          </div>

          <div style={{ 
            fontSize: '14px', 
            color: '#333',
            fontWeight: 'bold'
          }}>
            {vehicle.passengerCapacity}
          </div>
        </div>

        <div style={{ textAlign: 'right', marginLeft: '20px' }}>
          <div style={{
            background: isSelected ? '#667eea' : '#f8f9fa',
            color: isSelected ? 'white' : '#333',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '10px'
          }}>
            {formatCurrency(vehicle.systemRate)}/km
          </div>
          
          {isSelected && (
            <button
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Selected ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: '30px' }}>
      <h2 style={{ color: '#333', marginBottom: '25px' }}>🚗 Select Vehicle Type</h2>

      {/* Passenger Count and AC Preference */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '25px',
        padding: '20px',
        background: '#f8f9fa',
        borderRadius: '10px'
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold', 
            color: '#333' 
          }}>
            Passenger Capacity
          </label>
          <select
            value={passengerCount}
            onChange={(e) => setPassengerCount(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25].map(num => (
              <option key={num} value={num}>{num} passenger{num > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 'bold', 
            color: '#333' 
          }}>
            Air Conditioning
          </label>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="ac"
                value="ac"
                checked={acPreference === 'ac'}
                onChange={(e) => setAcPreference(e.target.value)}
                style={{ marginRight: '6px' }}
              />
              AC
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="ac"
                value="non-ac"
                checked={acPreference === 'non-ac'}
                onChange={(e) => setAcPreference(e.target.value)}
                style={{ marginRight: '6px' }}
              />
              Non-AC
            </label>
          </div>
        </div>
      </div>

      {/* Vehicle Cards */}
      <div>
        {suitableVehicles.length > 0 ? (
          suitableVehicles.map(vehicle => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isSelected={selectedVehicle?.id === vehicle.id}
            />
          ))
        ) : (
          <div style={{
            padding: '30px',
            textAlign: 'center',
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            color: '#856404'
          }}>
            <h3>No suitable vehicles found</h3>
            <p>Please adjust your passenger count to see available vehicle options.</p>
          </div>
        )}
      </div>

      {/* Accommodation Option */}
      {selectedVehicle && tripCalculation?.schedule?.daysNeeded > 1 && (
        <div style={{
          marginTop: '25px',
          padding: '20px',
          background: '#e3f2fd',
          borderRadius: '10px',
          border: '1px solid #bbdefb'
        }}>
          <h4 style={{ color: '#1565c0', marginBottom: '15px' }}>🏨 Driver Accommodation</h4>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="accommodation"
                checked={accommodationProvided}
                onChange={() => setAccommodationProvided(true)}
                style={{ marginRight: '8px' }}
              />
              I will provide accommodation for the driver
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="radio"
                name="accommodation"
                checked={!accommodationProvided}
                onChange={() => setAccommodationProvided(false)}
                style={{ marginRight: '8px' }}
              />
              Add accommodation cost to trip
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleSelection;
