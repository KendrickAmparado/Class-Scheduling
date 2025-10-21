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
          
        </div>
      </main>
    </div>
  );
};

export default Settings;