import React from 'react';

export const SkeletonBox = ({ width = '100%', height = '20px', borderRadius = '8px', style = {} }) => (
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

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ display: 'flex', gap: '12px' }}>
        {Array.from({ length: cols }).map((_, j) => (
          <SkeletonBox key={j} width={j === cols - 1 ? '20%' : '100%'} height="40px" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', borderLeft: '5px solid #f97316' }}>
    <SkeletonBox width="60%" height="24px" borderRadius="6px" style={{ marginBottom: '12px' }} />
    <SkeletonBox width="100%" height="16px" style={{ marginBottom: '8px' }} />
    <SkeletonBox width="80%" height="16px" />
  </div>
);

<style>{`
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`}</style>

