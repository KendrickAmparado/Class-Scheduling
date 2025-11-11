import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const Header = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  
  // Sync search input with URL query parameter when on search page
  useEffect(() => {
    if (location.pathname === '/admin/search') {
      const params = new URLSearchParams(location.search);
      const queryParam = params.get('q') || '';
      setSearch(queryParam);
    } else {
      // Clear search when navigating away from search page
      setSearch('');
    }
  }, [location]);
  
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
        background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 50%, #f97316 100%)',
        padding: '24px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
        position: 'fixed',
        top: 0,
        left: '280px',
        right: 0,
        width: 'calc(100% - 280px)',
        zIndex: 999,
        boxSizing: 'border-box',
        minHeight: '90px',
      }}
    >
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Additional left-side content if needed */}
        </div>
        <div className="header-center" style={{ flex: 1, maxWidth: '800px', margin: '0 30px' }}>
          <div className="search-container" style={{ position: 'relative', width: '100%' }}>
            <FontAwesomeIcon
              icon={faSearch}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                fontSize: '16px',
                zIndex: 2,
              }}
            />
            <input
              type="text"
              placeholder="Search schedules, instructors, rooms..."
              style={{
                width: '100%',
                padding: '14px 50px',
                border: '2px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '12px',
                fontSize: '15px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                fontWeight: '500',
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={(e) => {
                e.target.style.outline = 'none';
                e.target.style.borderColor = 'rgba(249, 115, 22, 0.6)';
                e.target.style.background = 'white';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                e.target.style.background = 'rgba(255, 255, 255, 0.95)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            />
          </div>
        </div>
        <div
          className="header-right"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div
            className="header-logos"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              backdropFilter: 'blur(8px)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
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
                padding: '3px',
                opacity: 0.98,
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
                padding: '3px',
                opacity: 0.98,
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
