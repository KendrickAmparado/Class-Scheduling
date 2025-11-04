import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const EmptyState = ({ 
  icon, 
  title, 
  message, 
  actionLabel, 
  onAction, 
  iconColor = '#94a3b8',
  iconSize = 64 
}) => {
  return (
    <div style={{
      background: '#fff',
      padding: '60px 30px',
      borderRadius: '18px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      textAlign: 'center',
      borderLeft: '5px solid #f97316',
    }}>
      {icon && (
        <FontAwesomeIcon 
          icon={icon} 
          style={{ 
            fontSize: iconSize, 
            color: iconColor, 
            marginBottom: '20px' 
          }} 
        />
      )}
      <h3 style={{
        fontSize: '20px',
        fontWeight: 700,
        color: '#1e293b',
        margin: '0 0 12px 0',
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '14px',
        color: '#64748b',
        margin: '0 0 24px 0',
        maxWidth: '400px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #0f2c63 0%, #f97316 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(15, 44, 99, 0.3)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 44, 99, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 44, 99, 0.3)';
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

