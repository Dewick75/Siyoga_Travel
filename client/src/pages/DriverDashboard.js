import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../components/Toast';

function DriverDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('vehicles');
  const [vehicles, setVehicles] = useState([]);
  const [availableBookings, setAvailableBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [vehicleCategories, setVehicleCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Vehicle form state
  const [vehicleForm, setVehicleForm] = useState({
    categoryId: '',
    makeModel: '',
    registrationNumber: '',
    yearManufactured: '',
    color: '',
    seatingCapacity: '',
    insuranceExpiry: ''
  });

  useEffect(() => {
    fetchVehicleCategories();
    fetchDriverVehicles();
    fetchAvailableBookings();
    fetchMyBookings();
  }, []);

  const fetchVehicleCategories = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/bookings/vehicle-categories');
      const data = await response.json();
      if (data.success) {
        setVehicleCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicle categories:', error);
    }
  };

  const fetchDriverVehicles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/drivers/vehicles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setVehicles(data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchAvailableBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/drivers/bookings/available', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAvailableBookings(data.data);
      }
    } catch (error) {
      console.error('Error fetching available bookings:', error);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/drivers/bookings/my-bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMyBookings(data.data);
      }
    } catch (error) {
      console.error('Error fetching my bookings:', error);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/drivers/vehicles/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(vehicleForm)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Vehicle added successfully!');
        setVehicleForm({
          categoryId: '',
          makeModel: '',
          registrationNumber: '',
          yearManufactured: '',
          color: '',
          seatingCapacity: '',
          insuranceExpiry: ''
        });
        fetchDriverVehicles();
      } else {
        toast.error(data.message || 'Failed to add vehicle');
      }
    } catch (error) {
      toast.error('Error adding vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/bookings/accept/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Booking accepted successfully!');
        fetchAvailableBookings();
        fetchMyBookings();
      } else {
        toast.error(data.message || 'Failed to accept booking');
      }
    } catch (error) {
      toast.error('Error accepting booking');
    } finally {
      setLoading(false);
    }
  };

  const { user: userData, profile } = user;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
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
          <div>
            <h1 style={{ color: '#333', margin: 0 }}>Driver Dashboard</h1>
            <p style={{ color: '#666', margin: '5px 0 0 0' }}>
              Welcome, {profile?.first_name || userData.email} {profile?.last_name || ''}!
            </p>
          </div>
          <button
            onClick={logout}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          marginBottom: '30px',
          borderBottom: '1px solid #ddd'
        }}>
          {[
            { id: 'vehicles', label: '🚗 My Vehicles', count: vehicles.length },
            { id: 'available', label: '📋 Available Bookings', count: availableBookings.length },
            { id: 'mybookings', label: '✅ My Bookings', count: myBookings.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? '#667eea' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#666',
                border: 'none',
                padding: '15px 25px',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '3px solid #667eea' : '3px solid transparent',
                fontSize: '16px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'vehicles' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Vehicle Management</h2>
            
            {/* Add Vehicle Form */}
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '30px'
            }}>
              <h3 style={{ color: '#333', marginTop: 0 }}>Add New Vehicle</h3>
              <form onSubmit={handleAddVehicle} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                <select
                  value={vehicleForm.categoryId}
                  onChange={(e) => setVehicleForm({...vehicleForm, categoryId: e.target.value})}
                  required
                  style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                >
                  <option value="">Select Vehicle Category</option>
                  {vehicleCategories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name} (Rs. {cat.driver_rate_per_km}/km)
                    </option>
                  ))}
                </select>
                
                <input
                  type="text"
                  placeholder="Make & Model (e.g., Toyota Corolla)"
                  value={vehicleForm.makeModel}
                  onChange={(e) => setVehicleForm({...vehicleForm, makeModel: e.target.value})}
                  required
                  style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
                
                <input
                  type="text"
                  placeholder="Registration Number"
                  value={vehicleForm.registrationNumber}
                  onChange={(e) => setVehicleForm({...vehicleForm, registrationNumber: e.target.value})}
                  required
                  style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
                
                <input
                  type="number"
                  placeholder="Year Manufactured"
                  value={vehicleForm.yearManufactured}
                  onChange={(e) => setVehicleForm({...vehicleForm, yearManufactured: e.target.value})}
                  style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
                
                <input
                  type="text"
                  placeholder="Color"
                  value={vehicleForm.color}
                  onChange={(e) => setVehicleForm({...vehicleForm, color: e.target.value})}
                  style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
                
                <input
                  type="number"
                  placeholder="Seating Capacity"
                  value={vehicleForm.seatingCapacity}
                  onChange={(e) => setVehicleForm({...vehicleForm, seatingCapacity: e.target.value})}
                  required
                  style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
                
                <input
                  type="date"
                  placeholder="Insurance Expiry"
                  value={vehicleForm.insuranceExpiry}
                  onChange={(e) => setVehicleForm({...vehicleForm, insuranceExpiry: e.target.value})}
                  required
                  style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
                />
                
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    gridColumn: 'span 2'
                  }}
                >
                  {loading ? 'Adding...' : 'Add Vehicle'}
                </button>
              </form>
            </div>

            {/* Vehicle List */}
            <div style={{ display: 'grid', gap: '15px' }}>
              {vehicles.map(vehicle => (
                <div key={vehicle.vehicle_id} style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ color: '#333', margin: '0 0 10px 0' }}>
                        {vehicle.make_model} ({vehicle.registration_number})
                      </h4>
                      <p style={{ color: '#666', margin: '5px 0' }}>
                        Category: {vehicle.category_name} | Seats: {vehicle.seating_capacity} | 
                        Rate: Rs. {vehicle.driver_rate_per_km}/km
                      </p>
                      <p style={{ color: '#666', margin: '5px 0' }}>
                        Color: {vehicle.color || 'Not specified'} | 
                        Year: {vehicle.year_manufactured || 'Not specified'}
                      </p>
                    </div>
                    <div style={{
                      background: vehicle.is_active ? '#28a745' : '#dc3545',
                      color: 'white',
                      padding: '5px 15px',
                      borderRadius: '20px',
                      fontSize: '12px'
                    }}>
                      {vehicle.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              ))}
              {vehicles.length === 0 && (
                <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                  No vehicles added yet. Add your first vehicle above!
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'available' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Available Bookings</h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              {availableBookings.map(booking => (
                <div key={booking.booking_id} style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ color: '#333', margin: '0 0 10px 0' }}>
                        {booking.pickup_location} → {JSON.parse(booking.destinations).join(', ')}
                      </h4>
                      <p style={{ color: '#666', margin: '5px 0' }}>
                        Tourist: {booking.tourist_first_name} {booking.tourist_last_name} | 
                        Phone: {booking.tourist_phone}
                      </p>
                      <p style={{ color: '#666', margin: '5px 0' }}>
                        Date: {new Date(booking.start_date).toLocaleDateString()} at {booking.start_time} | 
                        Travelers: {booking.travelers_count} | 
                        Distance: {booking.total_distance_km} km
                      </p>
                      <p style={{ color: '#666', margin: '5px 0' }}>
                        Vehicle Type: {booking.category_name} | 
                        Total Cost: Rs. {booking.total_cost}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAcceptBooking(booking.booking_id)}
                      disabled={loading}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        marginLeft: '20px'
                      }}
                    >
                      {loading ? 'Accepting...' : 'Accept Booking'}
                    </button>
                  </div>
                </div>
              ))}
              {availableBookings.length === 0 && (
                <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                  No available bookings matching your vehicle types.
                  {vehicles.length === 0 && ' Please add vehicles first.'}
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'mybookings' && (
          <div>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>My Accepted Bookings</h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              {myBookings.map(booking => (
                <div key={booking.booking_id} style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ color: '#333', margin: '0 0 10px 0' }}>
                        {booking.pickup_location} → {JSON.parse(booking.destinations).join(', ')}
                      </h4>
                      <p style={{ color: '#666', margin: '5px 0' }}>
                        Tourist: {booking.tourist_first_name} {booking.tourist_last_name} | 
                        Phone: {booking.tourist_phone}
                      </p>
                      <p style={{ color: '#666', margin: '5px 0' }}>
                        Date: {new Date(booking.start_date).toLocaleDateString()} at {booking.start_time} | 
                        Travelers: {booking.travelers_count} | 
                        Distance: {booking.total_distance_km} km
                      </p>
                      <p style={{ color: '#666', margin: '5px 0' }}>
                        Vehicle Type: {booking.category_name} | 
                        Total Cost: Rs. {booking.total_cost}
                      </p>
                    </div>
                    <div style={{
                      background: booking.status === 'confirmed' ? '#28a745' : 
                                 booking.status === 'pending' ? '#ffc107' : '#dc3545',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      textTransform: 'capitalize'
                    }}>
                      {booking.status === 'confirmed' ? 'Waiting for Payment' : booking.status}
                    </div>
                  </div>
                </div>
              ))}
              {myBookings.length === 0 && (
                <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                  No accepted bookings yet. Check available bookings to accept new trips!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverDashboard;
