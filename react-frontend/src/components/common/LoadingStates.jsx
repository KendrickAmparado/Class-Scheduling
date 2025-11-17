import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

/**
 * PageLoader - Full page loading component for route transitions
 */
export const PageLoader = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 50%, #f97316 100%)',
      gap: '20px',
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid rgba(255, 255, 255, 0.2)',
        borderTopColor: '#ffffff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{
        color: 'white',
        fontSize: '18px',
        fontWeight: '600',
        margin: 0,
      }}>
        Loading...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/**
 * InlineLoader - Small inline loading spinner
 */
export const InlineLoader = ({ size = 20, color = '#0f2c63' }) => {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <FontAwesomeIcon
        icon={faSpinner}
        spin
        style={{
          fontSize: `${size}px`,
          color: color,
        }}
      />
    </div>
  );
};

/**
 * ButtonLoader - Loading state for buttons
 */
export const ButtonLoader = ({ size = 16 }) => {
  return (
    <InlineLoader size={size} color="currentColor" />
  );
};

/**
 * Enhanced Skeleton Components with shimmer effect
 */
export const SkeletonBox = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '8px', 
  style = {} 
}) => (
  <div
    style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style,
    }}
  />
);

export const SkeletonCard = ({ 
  height = '200px',
  showAvatar = false,
  lines = 3 
}) => (
  <div style={{
    padding: '24px',
    background: '#fff',
    borderRadius: '14px',
    border: '2px solid #f1f5f9',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    height,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  }}>
    {showAvatar && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <SkeletonBox width="48px" height="48px" borderRadius="50%" />
        <div style={{ flex: 1 }}>
          <SkeletonBox width="60%" height="16px" style={{ marginBottom: '8px' }} />
          <SkeletonBox width="40%" height="14px" />
        </div>
      </div>
    )}
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBox
        key={i}
        width={i === lines - 1 ? '70%' : '100%'}
        height={i === 0 ? '20px' : '16px'}
        style={{ marginBottom: i < lines - 1 ? '8px' : 0 }}
      />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div style={{
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '2px solid #f1f5f9',
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '2px solid #f1f5f9' }}>
        {Array.from({ length: cols }).map((_, j) => (
          <SkeletonBox key={j} width={j === cols - 1 ? '20%' : '100%'} height="20px" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 0' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonBox key={j} width={j === cols - 1 ? '20%' : '100%'} height="16px" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

/**
 * ScheduleCardSkeleton - Specific skeleton for schedule cards
 */
export const ScheduleCardSkeleton = () => (
  <div style={{
    background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
    border: '2px solid #e5e7eb',
    borderRadius: '14px',
    padding: '20px',
    minHeight: '180px',
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '16px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e5e7eb',
    }}>
      <SkeletonBox width="60%" height="18px" />
      <div style={{ display: 'flex', gap: '8px' }}>
        <SkeletonBox width="32px" height="32px" borderRadius="8px" />
        <SkeletonBox width="32px" height="32px" borderRadius="8px" />
        <SkeletonBox width="32px" height="32px" borderRadius="8px" />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <SkeletonBox width="16px" height="16px" borderRadius="50%" />
        <SkeletonBox width="40%" height="14px" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <SkeletonBox width="16px" height="16px" borderRadius="50%" />
        <SkeletonBox width="50%" height="14px" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <SkeletonBox width="16px" height="16px" borderRadius="50%" />
        <SkeletonBox width="45%" height="14px" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <SkeletonBox width="16px" height="16px" borderRadius="50%" />
        <SkeletonBox width="35%" height="14px" />
      </div>
    </div>
  </div>
);

/**
 * RoomCardSkeleton - Specific skeleton for room cards
 */
export const RoomCardSkeleton = () => (
  <div style={{
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    border: '2px solid #f1f5f9',
    minHeight: '200px',
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '16px'
    }}>
      <SkeletonBox width="56px" height="56px" borderRadius="12px" />
      <div style={{ flex: 1 }}>
        <SkeletonBox width="60%" height="18px" style={{ marginBottom: '8px' }} />
        <SkeletonBox width="40%" height="14px" />
      </div>
    </div>
    <SkeletonBox width="100px" height="28px" borderRadius="8px" />
  </div>
);

/**
 * GridSkeletonLoader - Grid of skeleton cards
 */
export const GridSkeletonLoader = ({ 
  count = 6, 
  SkeletonComponent = SkeletonCard,
  columns = 3 
}) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(280px, 1fr))`,
    gap: '24px',
  }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonComponent key={i} />
    ))}
  </div>
);

/**
 * TableSkeletonLoader - Table skeleton with configurable rows
 */
export const TableSkeletonLoader = ({ rows = 5, cols = 4 }) => (
  <SkeletonTable rows={rows} cols={cols} />
);

// Add shimmer animation to global styles
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;
if (!document.head.querySelector('style[data-skeleton]')) {
  style.setAttribute('data-skeleton', 'true');
  document.head.appendChild(style);
}

const LoadingStates = {
  PageLoader,
  InlineLoader,
  ButtonLoader,
  SkeletonBox,
  SkeletonCard,
  SkeletonTable,
  ScheduleCardSkeleton,
  RoomCardSkeleton,
  GridSkeletonLoader,
  TableSkeletonLoader,
};

export default LoadingStates;

