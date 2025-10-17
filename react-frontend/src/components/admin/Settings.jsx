import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import '../../styles/Settings.css';

const Settings = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Settings" />
        
        <div className="dashboard-content">
          <div className="welcome-section">
            <h2>System Settings</h2>
            <p>Configure system preferences and settings</p>
          </div>
          
          <div style={{ padding: '20px', background: 'white', borderRadius: '10px', marginTop: '20px' }}>
            <p>Settings features will be implemented here:</p>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>System configuration</li>
              <li>User management</li>
              <li>Academic year settings</li>
              <li>Time slot configuration</li>
              <li>Backup and restore</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;