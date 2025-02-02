import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    stats: null,
    users: [],
    drivers: [],
    bookings: [],
    logs: []
  });

  // Redirect if not admin
  useEffect(() => {
    if (user && user.user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Load dashboard data
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardStats();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'drivers') {
      loadDrivers();
    } else if (activeTab === 'bookings') {
      loadBookings();
    } else if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/dashboard/stats');
      setData(prev => ({ ...prev, stats: response.data.data }));
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/users');
      setData(prev => ({ ...prev, users: response.data.data }));
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/drivers');
      setData(prev => ({ ...prev, drivers: response.data.data }));
    } catch (error) {
      console.error('Failed to load drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/bookings');
      setData(prev => ({ ...prev, bookings: response.data.data }));
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/logs');
      setData(prev => ({ ...prev, logs: response.data.data }));
    } catch (error) {
      console.error('Failed to load admin logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      await axios.put(`/api/admin/users/${userId}/toggle-status`);
      loadUsers(); // Reload users
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const updateDriverStatus = async (driverId, status, adminNotes = '') => {
    try {
      await axios.put(`/api/admin/drivers/${driverId}/status`, {
        status,
        adminNotes
      });
      loadDrivers(); // Reload drivers
    } catch (error) {
      console.error('Failed to update driver status:', error);
    }
  };

  const downloadReport = async (type, format = 'pdf') => {
    try {
      const response = await axios.get(`/api/admin/reports/${type}`, {
        params: { format },
        responseType: format === 'pdf' ? 'blob' : 'json'
      });

      if (format === 'pdf') {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}-report.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const viewReportData = async (type) => {
    try {
      const response = await axios.get(`/api/admin/reports/${type}`);
      if (response.data.success) {
        // Create a simple modal or alert to show the data
        const reportData = response.data.data;
        let message = `${type.toUpperCase()} REPORT\n\n`;

        if (reportData.summary) {
          message += 'SUMMARY:\n';
          Object.entries(reportData.summary).forEach(([key, value]) => {
            message += `${key.replace(/_/g, ' ').toUpperCase()}: ${value}\n`;
          });
          message += '\n';
        }

        if (type === 'revenue' && reportData.bookings) {
          message += `RECENT BOOKINGS (showing first 5):\n`;
          reportData.bookings.slice(0, 5).forEach((booking, index) => {
            message += `${index + 1}. Booking #${booking.booking_id} - Cost: Rs.${booking.total_cost} - Revenue: Rs.${booking.revenue}\n`;
          });
        }

        alert(message);
      }
    } catch (error) {
      console.error('Failed to view report data:', error);
      alert('Failed to load report data');
    }
  };

  if (!user || user.user.role !== 'admin') {
    return <div className="loading">Access Denied</div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          background: '#667eea',
          color: 'white',
          padding: '20px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>🛡️ Admin Dashboard</h1>
            <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Siyoga Travels Management</p>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'rgba(255,255,255,0.2)',
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
          borderBottom: '1px solid #eee',
          background: '#f8f9fa'
        }}>
          {[
            { key: 'dashboard', label: '📊 Dashboard', icon: '📊' },
            { key: 'users', label: '👥 Users', icon: '👥' },
            { key: 'drivers', label: '🚗 Drivers', icon: '🚗' },
            { key: 'bookings', label: '📋 Bookings', icon: '📋' },
            { key: 'reports', label: '📈 Reports', icon: '📈' },
            { key: 'logs', label: '🔍 Logs', icon: '🔍' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: activeTab === tab.key ? 'white' : 'transparent',
                border: 'none',
                padding: '15px 25px',
                cursor: 'pointer',
                borderBottom: activeTab === tab.key ? '3px solid #667eea' : '3px solid transparent',
                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                color: activeTab === tab.key ? '#667eea' : '#666'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ padding: '30px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && data.stats && (
            <div>
              <h2 style={{ marginTop: 0, color: '#333' }}>📊 Dashboard Overview</h2>
              
              {/* Stats Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  padding: '25px',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '36px' }}>{data.stats.totals.users}</h3>
                  <p style={{ margin: 0, opacity: 0.9 }}>Total Users</p>
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                  color: 'white',
                  padding: '25px',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '36px' }}>{data.stats.totals.drivers}</h3>
                  <p style={{ margin: 0, opacity: 0.9 }}>Total Drivers</p>
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                  color: 'white',
                  padding: '25px',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '36px' }}>{data.stats.totals.bookings}</h3>
                  <p style={{ margin: 0, opacity: 0.9 }}>Total Bookings</p>
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, #43e97b, #38f9d7)',
                  color: 'white',
                  padding: '25px',
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '36px' }}>
                    LKR {(data.stats.totals.revenue || 0).toLocaleString()}
                  </h3>
                  <p style={{ margin: 0, opacity: 0.9 }}>Total Revenue</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '10px',
                marginTop: '20px'
              }}>
                <h3 style={{ marginTop: 0, color: '#333' }}>📈 Recent Registrations (Last 30 Days)</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {data.stats.recentRegistrations.map((reg, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid #eee'
                    }}>
                      <span>{new Date(reg.date).toLocaleDateString()}</span>
                      <span style={{ fontWeight: 'bold', color: '#667eea' }}>{reg.count} new users</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <h2 style={{ marginTop: 0, color: '#333' }}>👥 User Management</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Role</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map(user => (
                      <tr key={user.user_id}>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{user.user_id}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{user.full_name}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{user.email}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                          <span style={{
                            background: user.role === 'driver' ? '#e3f2fd' : '#f3e5f5',
                            color: user.role === 'driver' ? '#1976d2' : '#7b1fa2',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {user.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                          <span style={{
                            background: user.is_active ? '#e8f5e8' : '#ffebee',
                            color: user.is_active ? '#2e7d32' : '#c62828',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                          <button
                            onClick={() => toggleUserStatus(user.user_id)}
                            style={{
                              background: user.is_active ? '#f44336' : '#4caf50',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Drivers Tab */}
          {activeTab === 'drivers' && (
            <div>
              <h2 style={{ marginTop: 0, color: '#333' }}>🚗 Driver Management</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Phone</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Vehicles</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.drivers.map(driver => (
                      <tr key={driver.driver_id}>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{driver.driver_id}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                          {driver.first_name} {driver.last_name}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{driver.email}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{driver.phone}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                          <span style={{
                            background:
                              driver.status === 'approved' ? '#e8f5e8' :
                              driver.status === 'pending' ? '#fff3e0' :
                              driver.status === 'rejected' ? '#ffebee' : '#f3e5f5',
                            color:
                              driver.status === 'approved' ? '#2e7d32' :
                              driver.status === 'pending' ? '#f57c00' :
                              driver.status === 'rejected' ? '#c62828' : '#7b1fa2',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {driver.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{driver.vehicle_count}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                          <select
                            value={driver.status}
                            onChange={(e) => updateDriverStatus(driver.driver_id, e.target.value)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #ddd',
                              fontSize: '12px'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div>
              <h2 style={{ marginTop: 0, color: '#333' }}>📋 Booking Management</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Tourist</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Driver</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Destination</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bookings.map(booking => (
                      <tr key={booking.booking_id}>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{booking.booking_id}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{booking.tourist_name}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                          {booking.driver_name || 'Unassigned'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{booking.destination}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                          {new Date(booking.start_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                          <span style={{
                            background:
                              booking.status === 'completed' ? '#e8f5e8' :
                              booking.status === 'confirmed' ? '#e3f2fd' :
                              booking.status === 'pending' ? '#fff3e0' : '#ffebee',
                            color:
                              booking.status === 'completed' ? '#2e7d32' :
                              booking.status === 'confirmed' ? '#1976d2' :
                              booking.status === 'pending' ? '#f57c00' : '#c62828',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {booking.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                          LKR {(booking.total_cost || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <h2 style={{ marginTop: 0, color: '#333' }}>📈 Reports & Analytics</h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {/* Users Report */}
                {/* <div style={{
                  background: '#f8f9fa',
                  padding: '25px',
                  borderRadius: '10px',
                  border: '1px solid #e9ecef'
                }}>
                  <h3 style={{ marginTop: 0, color: '#333' }}>👥 Users Report</h3>
                  <p style={{ color: '#666', marginBottom: '20px' }}>
                    Generate comprehensive reports of all users, tourists, and drivers.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => downloadReport('users', 'pdf')}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📄 Download PDF
                    </button>
                    <button
                      onClick={() => downloadReport('users', 'json')}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📊 View Data
                    </button>
                  </div>
                </div> */}

                {/* Bookings Report */}
                {/* <div style={{
                  background: '#f8f9fa',
                  padding: '25px',
                  borderRadius: '10px',
                  border: '1px solid #e9ecef'
                }}>
                  <h3 style={{ marginTop: 0, color: '#333' }}>📋 Bookings Report</h3>
                  <p style={{ color: '#666', marginBottom: '20px' }}>
                    Generate detailed booking reports with revenue analytics.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => downloadReport('bookings', 'pdf')}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📄 Download PDF
                    </button>
                    <button
                      onClick={() => downloadReport('bookings', 'json')}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📊 View Data
                    </button>
                  </div>
                </div> */}

                {/* Driver Performance Report */}
                {/* <div style={{
                  background: '#f8f9fa',
                  padding: '25px',
                  borderRadius: '10px',
                  border: '1px solid #e9ecef'
                }}>
                  <h3 style={{ marginTop: 0, color: '#333' }}>🚗 Driver Performance</h3>
                  <p style={{ color: '#666', marginBottom: '20px' }}>
                    Comprehensive driver statistics, earnings, and performance metrics.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => downloadReport('driver-performance', 'json')}
                      style={{
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📊 View Report
                    </button>
                  </div>
                </div> */}

                {/* Popular Destinations Report */}
                {/* <div style={{
                  background: '#f8f9fa',
                  padding: '25px',
                  borderRadius: '10px',
                  border: '1px solid #e9ecef'
                }}>
                  <h3 style={{ marginTop: 0, color: '#333' }}>🗺️ Popular Destinations</h3>
                  <p style={{ color: '#666', marginBottom: '20px' }}>
                    Most visited destinations, popular routes, and travel patterns.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => downloadReport('popular-destinations', 'json')}
                      style={{
                        background: '#fd7e14',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📊 View Report
                    </button>
                  </div>
                </div> */}

                {/* Revenue Report */}
                <div style={{
                  background: '#f8f9fa',
                  padding: '25px',
                  borderRadius: '10px',
                  border: '1px solid #e9ecef'
                }}>
                  <h3 style={{ marginTop: 0, color: '#333' }}>💰 Revenue Report</h3>
                  <p style={{ color: '#666', marginBottom: '20px' }}>
                  Total revenue calculation (15% of booking costs) with detailed breakdown.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => downloadReport('revenue')}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📄 Download PDF
                    </button>
                    <button
                      onClick={() => viewReportData('revenue')}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      📊 View Data
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              {data.stats && (
                <div style={{
                  background: '#e3f2fd',
                  padding: '20px',
                  borderRadius: '10px',
                  marginTop: '30px'
                }}>
                  <h3 style={{ marginTop: 0, color: '#1976d2' }}>📊 Quick Statistics</h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                        {data.stats.totals.users}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>Total Users</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                        {data.stats.totals.drivers}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>Active Drivers</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                        {data.stats.totals.bookings}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>Total Bookings</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                        LKR {(data.stats.totals.revenue || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>Total Revenue</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin Logs Tab */}
          {activeTab === 'logs' && (
            <div>
              <h2 style={{ marginTop: 0, color: '#333' }}>🔍 Admin Activity Logs</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Track all administrative actions and system activities.
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Admin</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Action</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Details</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.logs.map(log => (
                      <tr key={log.log_id}>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{log.log_id}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{log.admin_email}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                          <span style={{
                            background:
                              log.action.includes('UPDATE') ? '#e3f2fd' :
                              log.action.includes('VIEW') ? '#f3e5f5' :
                              log.action.includes('SYSTEM') ? '#e8f5e8' : '#fff3e0',
                            color:
                              log.action.includes('UPDATE') ? '#1976d2' :
                              log.action.includes('VIEW') ? '#7b1fa2' :
                              log.action.includes('SYSTEM') ? '#2e7d32' : '#f57c00',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #ddd', maxWidth: '200px' }}>
                          <div style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '12px',
                            color: '#666'
                          }}>
                            {log.details ? JSON.stringify(JSON.parse(log.details), null, 2).substring(0, 50) + '...' : 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #ddd', fontSize: '12px' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.logs.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#666',
                  background: '#f8f9fa',
                  borderRadius: '10px',
                  marginTop: '20px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>📝</div>
                  <div>No admin activity logs found</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
