import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const Header = ({ title }) => {
  return (
    <header
      className="top-header"
      style={{
        background: 'linear-gradient(135deg, #0f2c63 0%, #f97316 100%)',
        padding: '15px 25px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
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
            }}
          />
          <input
            type="text"
            placeholder="Search schedules, instructors, rooms..."
            style={{
              width: '100%',
              padding: '12px 45px',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              background: '#f8fafc',
              transition: 'all 0.3s ease',
            }}
            onFocus={(e) => {
              e.target.style.outline = 'none';
              e.target.style.borderColor = '#0f2c63';
              e.target.style.background = 'white';
              e.target.style.boxShadow = '0 0 0 3px rgba(15, 44, 99, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.background = '#f8fafc';
              e.target.style.boxShadow = 'none';
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
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
