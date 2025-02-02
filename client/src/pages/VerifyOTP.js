import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email from navigation state
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/auth/verify-otp', {
        email,
        otp
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ 
            color: '#333', 
            marginBottom: '10px',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            Verify Your Email
          </h2>
          <p style={{ color: '#666', margin: 0 }}>
            Enter the 6-digit code sent to<br />
            <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="otp" style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              Verification Code
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={handleOtpChange}
              placeholder="Enter 6-digit code"
              required
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '18px',
                textAlign: 'center',
                letterSpacing: '8px',
                fontFamily: 'monospace',
                fontWeight: 'bold'
              }}
              maxLength="6"
            />
          </div>

          {error && (
            <div style={{
              background: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: '#efe',
              color: '#363',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #cfc'
            }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            style={{
              width: '100%',
              padding: '15px',
              background: loading || otp.length !== 6 
                ? '#ccc' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '6px'
        }}>
          <p style={{ 
            margin: '0 0 10px 0', 
            color: '#666', 
            fontSize: '14px' 
          }}>
            Didn't receive the code?
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifyOTP;
