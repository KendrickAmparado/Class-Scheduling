import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faCode } from '@fortawesome/free-solid-svg-icons';
import '../../styles/ManageSchedule.css';

const ManageSchedule = () => {
  const navigate = useNavigate();
  const [yearLevels, setYearLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchYearLevels = () => {
    setLoading(true);
    fetch('/api/year-levels')
      .then(res => res.json())
      .then(data => {
        setYearLevels(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching year levels:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchYearLevels();
  }, []);

  const navigateToSchedule = (course, year) => {
    navigate(`/admin/schedule/${course}/${year.replace(' ', '').toLowerCase()}`);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Manage Schedule" />
        <div
          style={{
            padding: '30px',
            background: 'linear-gradient(135deg, #0f2c63 0%, #f97316 100%)',
            minHeight: 'calc(100vh - 80px)',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              marginBottom: '30px',
              borderLeft: '5px solid #f97316',
            }}
          >
            <h2 style={{
                color: '#1e293b',
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '8px',
              }}>
              Welcome to Schedule Management
            </h2>
            <p style={{ color: '#64748b', fontSize: '16px', margin: '0' }}>
              Manage your class scheduling system efficiently
            </p>
          </div>

          <div className="dashboard-content">
            {loading ? (
              <p style={{ color: 'white', fontSize: '18px' }}>Loading year levels...</p>
            ) : yearLevels.length === 0 ? (
              <p style={{ color: 'white', fontSize: '18px' }}>No year levels found.</p>
            ) : (
              <div className="years-grid">
                {yearLevels.map(level => (
                  <div
                    key={level._id}
                    className="year-card"
                    onClick={() => navigateToSchedule(level.course, level.year)}
                    style={{
                      background:
                        level.course === 'bsit' ?
                          'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)' :
                          'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                      cursor: 'pointer',
                    }}
                  >
                    <FontAwesomeIcon icon={level.course === 'bsit' ? faGraduationCap : faCode} />
                    <div className="year-title">{`${level.course.toUpperCase()} ${level.year}`}</div>
                    <div className="year-subtitle">{level.subtitle}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManageSchedule;
