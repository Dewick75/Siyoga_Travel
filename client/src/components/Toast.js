import React, { useState, useEffect } from 'react';

// Simple toast notification system
let toastId = 0;
const toastCallbacks = [];

export const toast = {
  success: (message) => showToast(message, 'success'),
  error: (message) => showToast(message, 'error'),
  info: (message) => showToast(message, 'info'),
  warning: (message) => showToast(message, 'warning')
};

const showToast = (message, type) => {
  const id = ++toastId;
  const toastData = { id, message, type, timestamp: Date.now() };
  
  toastCallbacks.forEach(callback => callback(toastData));
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toastCallbacks.forEach(callback => callback({ id, remove: true }));
  }, 3000);
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (toastData) => {
      if (toastData.remove) {
        setToasts(prev => prev.filter(t => t.id !== toastData.id));
      } else {
        setToasts(prev => [...prev, toastData]);
      }
    };

    toastCallbacks.push(handleToast);

    return () => {
      const index = toastCallbacks.indexOf(handleToast);
      if (index > -1) {
        toastCallbacks.splice(index, 1);
      }
    };
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getToastStyles = (type) => {
    const baseStyles = {
      padding: '12px 16px',
      marginBottom: '8px',
      borderRadius: '6px',
      color: 'white',
      fontWeight: '500',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      position: 'relative',
      overflow: 'hidden'
    };

    const typeStyles = {
      success: { background: '#10b981' },
      error: { background: '#ef4444' },
      info: { background: '#3b82f6' },
      warning: { background: '#f59e0b' }
    };

    return { ...baseStyles, ...typeStyles[type] };
  };

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      maxWidth: '400px',
      width: '100%'
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={getToastStyles(toast.type)}
          onClick={() => removeToast(toast.id)}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{toast.message}</span>
            <span style={{ 
              marginLeft: '12px', 
              fontSize: '16px',
              opacity: 0.8,
              cursor: 'pointer'
            }}>
              ×
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default { toast, ToastContainer };
