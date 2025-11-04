import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';

const TableSortHeader = ({ 
  children, 
  sortKey, 
  currentSort, 
  onSort, 
  style = {},
  align = 'left'
}) => {
  const isActive = currentSort.key === sortKey;
  const sortDirection = isActive ? currentSort.direction : null;
  
  const getSortIcon = () => {
    if (!isActive) return faSort;
    return sortDirection === 'asc' ? faSortUp : faSortDown;
  };
  
  const handleClick = () => {
    if (onSort) {
      const newDirection = isActive && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(sortKey, newDirection);
    }
  };

  return (
    <th
      onClick={handleClick}
      style={{
        ...style,
        cursor: onSort ? 'pointer' : 'default',
        userSelect: 'none',
        textAlign: align,
        position: 'relative',
        transition: 'background 0.2s ease'
      }}
      onMouseEnter={(e) => {
        if (onSort) {
          e.currentTarget.style.background = '#f3f4f6';
        }
      }}
      onMouseLeave={(e) => {
        if (onSort) {
          e.currentTarget.style.background = isActive ? '#e5e7eb' : style.background || '#f9fafb';
        }
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start'
      }}>
        <span>{children}</span>
        {onSort && (
          <FontAwesomeIcon 
            icon={getSortIcon()} 
            style={{ 
              fontSize: '12px', 
              color: isActive ? '#0f2c63' : '#9ca3af',
              opacity: isActive ? 1 : 0.5
            }} 
          />
        )}
      </div>
    </th>
  );
};

export default TableSortHeader;

