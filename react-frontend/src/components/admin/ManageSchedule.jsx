import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faCode, faPlus, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../../styles/ManageSchedule.css';

const ManageSchedule = () => {
  const navigate = useNavigate();
  const [yearLevels, setYearLevels] = useState([]);
  const [showAddYearPopup, setShowAddYearPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch all the available years from the database
  const fetchYearLevels = () => {
    setLoading(true);
    fetch('/api/year-levels')
      .then((res) => res.json())
      .then((data) => {
        setYearLevels(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching year levels:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchYearLevels();
  }, []);

  const navigateToSchedule = (course, year) => {
    navigate(`/admin/schedule/${course}/${year.replace(' ', '').toLowerCase()}`);
  };

  // Add Year submission handler with detailed error feedback and debug logs
  const handleAddYearSubmit = async (yearData) => {
    try {
      const res = await fetch('/api/year-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yearData),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Failed to save year data');
      }
      setShowAddYearPopup(false);
      setShowSuccessPopup(true);
      fetchYearLevels(); // Refresh data after adding
    } catch (error) {
      console.error('Error adding year:', error);
      alert('Failed to add year level: ' + error.message);
    }
  };

  // Delete Year handler
  const handleDeleteYear = async (id) => {
    if (!window.confirm('Are you sure you want to delete this year level?')) return;

    try {
      await fetch(`/api/year-levels/${id}`, { method: 'DELETE' });
      setYearLevels((prev) => prev.filter((year) => year._id !== id));
    } catch (error) {
      console.error('Error deleting year:', error);
    }
  };

  const openAddPopup = () => setShowAddYearPopup(true);

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
            <h2
              style={{
                color: '#1e293b',
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '8px',
              }}
            >
              Welcome to Schedule Management
            </h2>
            <p style={{ color: '#64748b', fontSize: '16px', margin: '0' }}>
              Manage your class scheduling system efficiently
            </p>
          </div>

          {/* Add / Delete Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginBottom: '30px',
            }}
          >
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(15, 44, 99, 0.3)',
              }}
              onClick={openAddPopup}
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Year
            </button>

            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
              }}
              onClick={() => {
                const id = prompt('Enter the ID of the year level to delete:');
                if (id) handleDeleteYear(id);
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
              Delete Year
            </button>
          </div>

          {/* Display Existing Year Levels */}
          <div className="dashboard-content">
            {loading ? (
              <p style={{ color: 'white', fontSize: '18px' }}>Loading year levels...</p>
            ) : yearLevels.length === 0 ? (
              <p style={{ color: 'white', fontSize: '18px' }}>No year levels found.</p>
            ) : (
              <div className="years-grid">
                {yearLevels.map((level) => (
                  <div
                    key={level._id}
                    className="year-card"
                    onClick={() => navigateToSchedule(level.course, level.year)}
                    style={{
                      background:
                        level.course === 'bsit'
                          ? 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)'
                          : 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
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

        {/* Add Year Popup */}
        {showAddYearPopup && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            tabIndex="0"
          >
            <div
              style={{
                background: 'white',
                borderRadius: '15px',
                padding: '30px',
                width: '600px',
                maxWidth: '95vw',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '25px',
                  borderBottom: '2px solid #f1f5f9',
                  paddingBottom: '15px',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    color: '#1e293b',
                    fontSize: '20px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} style={{ color: '#0f2c63' }} />
                  Add New Year Level
                </h3>
                <button
                  onClick={() => setShowAddYearPopup(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '5px',
                    borderRadius: '50%',
                    width: '35px',
                    height: '35px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#f1f5f9';
                    e.target.style.color = '#374151';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'none';
                    e.target.style.color = '#64748b';
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  console.log('Submitting:', {
                    course: formData.get('course'),
                    subtitle: formData.get('subtitle'),
                    year: formData.get('year'),
                  });
                  handleAddYearSubmit({
                    course: formData.get('course'),
                    subtitle: formData.get('subtitle'),
                    year: formData.get('year'),
                  });
                }}
              >
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Course *</label>
                  <select
                    name="course"
                    required
                    style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '2px solid #e2e8f0' }}
                  >
                    <option value="">Select Course</option>
                    <option value="bsit">BSIT - Bachelor of Science in Information Technology</option>
                    <option value="bsemc-dat">BSEMC-DAT - BS in Entertainment & Multimedia Computing</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Subtitle *</label>
                  <input
                    type="text"
                    name="subtitle"
                    required
                    placeholder="Enter Subtitle"
                    style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '2px solid #e2e8f0' }}
                  />
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Year Level *</label>
                  <select
                    name="year"
                    required
                    style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '2px solid #e2e8f0' }}
                  >
                    <option value="">Select Year Level</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddYearPopup(false)}
                    style={{ padding: '12px 24px', background: '#f1f5f9', borderRadius: '8px', color: '#64748b', fontWeight: '600' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      boxShadow: '0 4px 15px rgba(15, 44, 99, 0.3)',
                      cursor: 'pointer',
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} /> Add Year
                  </button>
                  {/* Hidden fallback submit button for reliability */}
                  <button type="submit" style={{ display: 'none' }}>
                    Fallback Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success Popup */}
        {showSuccessPopup && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
            }}
          >
            <div
              style={{
                background: 'white',
                padding: '20px 30px',
                borderRadius: '15px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                fontSize: '18px',
                fontWeight: '600',
                color: '#0f2c63',
                minWidth: '320px',
                justifyContent: 'space-between',
              }}
            >
              <span>Year added successfully!</span>
              <button
                onClick={() => setShowSuccessPopup(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '24px',
                  color: '#0f2c63',
                  lineHeight: 1,
                }}
                aria-label="Close success message"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageSchedule;
