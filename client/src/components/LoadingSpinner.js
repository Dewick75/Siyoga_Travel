import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }) => {
  const sizeStyles = {
    small: { width: '20px', height: '20px' },
    medium: { width: '40px', height: '40px' },
    large: { width: '60px', height: '60px' }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div
        className="spinner"
        style={{
          ...sizeStyles[size],
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          marginBottom: '10px'
        }}
      />
      <p style={{
        color: '#666',
        fontSize: '14px',
        margin: 0,
        textAlign: 'center'
      }}>
        {message}
      </p>
    </div>
  );
};

export default LoadingSpinner;
