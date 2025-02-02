import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'tourist',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Basic validation
    // Frontend validation
    if (formData.firstName.trim().length < 2) {
      setError('First name must be at least 2 characters long');
      setLoading(false);
      return;
    }

    if (formData.lastName.trim().length < 2) {
      setError('Last name must be at least 2 characters long');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    // Check password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      setLoading(false);
      return;
    }

    // Prepare data for API
    const { confirmPassword, ...registrationData } = formData;

    const result = await register(registrationData);

    if (result.success) {
      setSuccess(result.message);
      // Redirect to OTP verification page with email
      setTimeout(() => {
        navigate('/verify-otp', {
          state: { email: formData.email }
        });
      }, 1500);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">🌍 Siyoga Travel</h2>
      <h3 style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>Register</h3>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="role">I am a</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="tourist">Tourist</option>
            <option value="driver">Driver</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            placeholder="Enter your first name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            placeholder="Enter your last name"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="Enter your phone number"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
          />
          <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
            Must be at least 8 characters with uppercase, lowercase, and number
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
          />
        </div>
        
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <div className="auth-link">
        Already have an account? <Link to="/login">Login here</Link>
      </div>
    </div>
  );
}

export default Register;
