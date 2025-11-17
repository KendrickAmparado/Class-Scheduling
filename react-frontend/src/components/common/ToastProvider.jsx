import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Toast from './Toast.jsx';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Expose showToast globally for API client and other utilities
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showToast = showToast;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.showToast;
      }
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 10000, pointerEvents: 'none' }}>
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              marginBottom: index > 0 ? 10 : 0,
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
