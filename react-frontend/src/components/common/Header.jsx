import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const Header = ({ title }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      const q = search.trim();
      if (q) {
        navigate(`/admin/search?q=${encodeURIComponent(q)}`);
      }
    }
  };
  return (
    <header
      className="top-header"
      style={{
        background: 'linear-gradient(135deg, #0f2c63 0%, #1e3a72 20%, #2d4a81 40%, #ea580c 70%, #f97316 100%)',
        padding: '15px 25px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(15, 44, 99, 0.25), 0 2px 8px rgba(249, 115, 22, 0.15)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
      }}
    >
      {/* Subtle overlay pattern for texture */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Additional left-side content if needed */}
        </div>
        <div className="header-center" style={{ flex: 1, maxWidth: '700px', margin: '0 30px' }}>
          <div className="search-container" style={{ position: 'relative', width: '100%' }}>
            <FontAwesomeIcon
              icon={faSearch}
              style={{
                position: 'absolute',
                left: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                fontSize: '16px',
                zIndex: 2,
              }}
            />
            <input
              type="text"
              placeholder="Search schedules, instructors, rooms..."
              style={{
                width: '100%',
                padding: '12px 45px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                fontSize: '14px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                e.target.style.background = 'white';
                e.target.style.boxShadow = '0 4px 20px rgba(15, 44, 99, 0.2), 0 0 0 3px rgba(249, 115, 22, 0.1)';
                e.target.style.transform = 'scale(1.02)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.95)';
                e.target.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
                e.target.style.transform = 'scale(1)';
              }}
            />
          </div>
        </div>
        <div
          className="header-right"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '25px',
          }}
        >
          <div
            className="header-logos"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(5px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <img
              src="/images/COT-LOGO_T.png"
              alt="COT Logo"
              className="header-logo"
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain',
                borderRadius: '8px',
                padding: '4px',
                filter: 'brightness(1.1)',
              }}
            />
            <img
              src="/images/buksuu.png"
              alt="Buksu Logo"
              className="header-logo"
              style={{
                width: '60px',
                height: '60px',
                objectFit: 'contain',
                borderRadius: '8px',
                padding: '4px',
                filter: 'brightness(1.1)',
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
