import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import '../../styles/RoomManagement.css';

const RoomManagement = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Room Management" />
        
        <div className="dashboard-content">
          <div className="welcome-section">
            <h2>Room Management</h2>
            <p>Manage classrooms and facilities</p>
          </div>
          
          <div style={{ padding: '20px', background: 'white', borderRadius: '10px', marginTop: '20px' }}>
            <p>Room management features will be implemented here:</p>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>Add new rooms</li>
              <li>Edit room information</li>
              <li>Set room capacity</li>
              <li>Manage room availability</li>
              <li>Room maintenance scheduling</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoomManagement;