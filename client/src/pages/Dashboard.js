import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handlePlanTrip = () => {
    navigate('/trip-planner');
  };

  // Redirect users based on role
  useEffect(() => {
    if (user && user.user.role === 'driver') {
      navigate('/driver-dashboard');
    } else if (user && user.user.role === 'admin') {
      navigate('/admin-dashboard');
    }
  }, [user, navigate]);

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  const { user: userData, profile } = user;

  // Sri Lankan destinations data
  const destinations = [
    {
      id: 1,
      name: "Sigiriya Rock Fortress",
      location: "Sigiriya",
      image: "🏰",
      description: "Ancient rock fortress and palace ruins"
    },
    {
      id: 2,
      name: "Temple of the Tooth",
      location: "Kandy",
      image: "🏛️",
      description: "Sacred Buddhist temple housing Buddha's tooth relic"
    },
    {
      id: 3,
      name: "Yala National Park",
      location: "Yala",
      image: "🐘",
      description: "Wildlife safari with leopards and elephants"
    },
    {
      id: 4,
      name: "Galle Fort",
      location: "Galle",
      image: "🏰",
      description: "Historic Dutch colonial fort by the sea"
    },
    {
      id: 5,
      name: "Adam's Peak",
      location: "Ratnapura",
      image: "⛰️",
      description: "Sacred mountain with stunning sunrise views"
    },
    {
      id: 6,
      name: "Ella Rock",
      location: "Ella",
      image: "🌄",
      description: "Scenic hill country with tea plantations"
    }
  ];

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
            <h1 style={{ color: '#333', margin: 0 }}>
              Welcome to Siyoga Travels
            </h1>
            <p style={{ color: '#666', margin: '5px 0 0 0' }}>
              Hello, {profile?.first_name || userData.email} {profile?.last_name || ''}!
              {userData.role === 'tourist' ? ' Discover beautiful Sri Lanka.' : ' Manage your driving services.'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>

        {/* Tourist Dashboard */}
        {userData.role === 'tourist' && (
          <>
            {/* Plan Trip Button */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <button
                onClick={handlePlanTrip}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '15px 40px',
                  borderRadius: '25px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 5px 15px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.3)';
                }}
              >
                🗺️ Plan a Trip
              </button>
            </div>

            {/* Destinations Grid */}
            <div>
              <h2 style={{ color: '#333', marginBottom: '20px', textAlign: 'center' }}>
                Popular Sri Lankan Destinations
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {destinations.map(destination => (
                  <div
                    key={destination.id}
                    style={{
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '10px',
                      border: '1px solid #e9ecef',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                      {destination.image}
                    </div>
                    <h3 style={{ color: '#333', margin: '0 0 10px 0' }}>
                      {destination.name}
                    </h3>
                    <p style={{ color: '#667eea', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                      📍 {destination.location}
                    </p>
                    <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                      {destination.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Driver Dashboard */}
        {userData.role === 'driver' && (
          <div style={{
            background: '#f3e5f5',
            padding: '30px',
            borderRadius: '10px',
            border: '1px solid #ce93d8',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#7b1fa2', marginTop: 0 }}>Driver Dashboard</h2>
            <p style={{ color: '#666', fontSize: '16px' }}>
              Manage your driving services and connect with tourists.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginTop: '30px'
            }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                <h4 style={{ color: '#7b1fa2', margin: '0 0 10px 0' }}>🚗 Vehicle Management</h4>
                <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Add and manage your vehicles</p>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                <h4 style={{ color: '#7b1fa2', margin: '0 0 10px 0' }}>📋 Trip Requests</h4>
                <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>View and accept trip bookings</p>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                <h4 style={{ color: '#7b1fa2', margin: '0 0 10px 0' }}>💰 Earnings</h4>
                <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Track your income</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
