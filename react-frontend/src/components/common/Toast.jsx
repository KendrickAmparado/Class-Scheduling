import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faExclamationTriangle, faInfoCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: faCheckCircle,
    error: faTimesCircle,
    warning: faExclamationTriangle,
    info: faInfoCircle,
  };

  const colors = {
    success: { bg: '#10b981', icon: '#ffffff', border: '#059669' },
    error: { bg: '#ef4444', icon: '#ffffff', border: '#dc2626' },
    warning: { bg: '#f59e0b', icon: '#ffffff', border: '#d97706' },
    info: { bg: '#3b82f6', icon: '#ffffff', border: '#2563eb' },
  };

  const color = colors[type] || colors.success;
  const icon = icons[type] || icons.success;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        background: color.bg,
        color: '#ffffff',
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minWidth: 300,
        maxWidth: 500,
        zIndex: 10000,
        animation: 'slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(-4px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateX(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)';
      }}
    >
      <FontAwesomeIcon icon={icon} style={{ fontSize: 20, color: color.icon, flexShrink: 0 }} />
      <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          opacity: 0.8,
        }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseOut={(e) => (e.currentTarget.style.opacity = '0.8')}
      >
        <FontAwesomeIcon icon={faTimes} style={{ fontSize: 14 }} />
      </button>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;
