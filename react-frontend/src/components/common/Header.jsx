import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faBell } from '@fortawesome/free-solid-svg-icons';

const Header = ({ title }) => {

  return (
    <header className="top-header" style={{
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      padding: '15px 25px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div className="header-left" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
      </div>
      
      <div className="header-center" style={{
        flex: 1,
        maxWidth: '700px',
        margin: '0 30px'
      }}>
        <div className="search-container" style={{
          position: 'relative',
          width: '100%'
        }}>
          <FontAwesomeIcon 
            icon={faSearch} 
            style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              fontSize: '16px'
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
              transition: 'all 0.3s ease'
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
      
      <div className="header-right" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '25px'
      }}>
        <div 
          className="notification-icon"
          style={{
            position: 'relative',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#979898';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
          }}
        >
          <FontAwesomeIcon 
            icon={faBell} 
            style={{
              fontSize: '18px',
              color: '#ffffff'
            }}
          />
          <span 
            className="notification-badge"
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              background: '#ef4444',
              color: 'white',
              fontSize: '12px',
              padding: '2px 6px',
              borderRadius: '10px',
              minWidth: '18px',
              textAlign: 'center'
            }}
          >
            3
          </span>
        </div>
        
        <div className="header-logos" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px'
        }}>
          <img 
            src="/images/COT-LOGO_T.png" 
            alt="COT Logo" 
            className="header-logo"
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'contain',
              borderRadius: '8px',
              padding: '4px'
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
              padding: '4px'
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;