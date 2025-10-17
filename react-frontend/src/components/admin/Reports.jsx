import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import '../../styles/Reports.css';

const Reports = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Reports" />
        
        <div className="dashboard-content">
          <div className="welcome-section">
            <h2>System Reports</h2>
            <p>Generate and view various system reports</p>
          </div>
          
          <div style={{ padding: '20px', background: 'white', borderRadius: '10px', marginTop: '20px' }}>
            <p>Report features will be implemented here:</p>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>Schedule utilization reports</li>
              <li>Room occupancy reports</li>
              <li>Instructor workload reports</li>
              <li>Class enrollment reports</li>
              <li>Export reports to PDF/Excel</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;