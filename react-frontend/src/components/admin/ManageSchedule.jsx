import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faCode, faPlus, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../../styles/ManageSchedule.css';

const ManageSchedule = () => {
  const navigate = useNavigate();
  const [showAddYearPopup, setShowAddYearPopup] = useState(false);

  const yearLevels = [
    { year: '1st Year', course: 'bsit', title: 'BSIT 1st Year', subtitle: 'Bachelor of Science in Information Technology' },
    { year: '2nd Year', course: 'bsit', title: 'BSIT 2nd Year', subtitle: 'Bachelor of Science in Information Technology' },
    { year: '3rd Year', course: 'bsit', title: 'BSIT 3rd Year', subtitle: 'Bachelor of Science in Information Technology' },
    { year: '4th Year', course: 'bsit', title: 'BSIT 4th Year', subtitle: 'Bachelor of Science in Information Technology' },
    { year: '1st Year', course: 'bsemc-dat', title: 'BSEMC-DAT 1st Year', subtitle: 'Bachelor of Science in Entertainment and Multimedia Computing – Digital Animation Technology' },
    { year: '2nd Year', course: 'bsemc-dat', title: 'BSEMC-DAT 2nd Year', subtitle: 'Bachelor of Science in Entertainment and Multimedia Computing – Digital Animation Technology' },
    { year: '3rd Year', course: 'bsemc-dat', title: 'BSEMC-DAT 3rd Year', subtitle: 'Bachelor of Science in Entertainment and Multimedia Computing – Digital Animation Technology' },
    { year: '4th Year', course: 'bsemc-dat', title: 'BSEMC-DAT 4th Year', subtitle: 'Bachelor of Science in Entertainment and Multimedia Computing – Digital Animation Technology' }
  ];

  const navigateToSchedule = (course, year) => {
    navigate(`/admin/schedule/${course}/${year.replace(' ', '').toLowerCase()}`);
  };

  const addYear = () => {
    setShowAddYearPopup(true);
  };

  const handleAddYearSubmit = (yearData) => {
    // Add logic to add the new year to the system
    setShowAddYearPopup(false);
    alert(`Year added successfully!\nCourse: ${yearData.course}\nSubtitle: ${yearData.subtitle}\nYear: ${yearData.year}`);
  };

  const deleteYear = () => {
    alert('Delete Year functionality would allow selecting and removing a year level from the system.');
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Manage Schedule" />
        
        <div style={{padding: '30px', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', minHeight: 'calc(100vh - 80px)', overflowY: 'auto'}}>
          <div style={{background: '#dedede', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', marginBottom: '30px', borderLeft: '5px solid #0f2c63'}}>
            <h2 style={{color: '#1e293b', fontSize: '28px', fontWeight: '700', marginBottom: '8px'}}>Welcome to Schedule Management</h2>
            <p style={{color: '#64748b', fontSize: '16px', margin: '0'}}>Manage your class scheduling system efficiently</p>
          </div>
          
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '30px'}}>
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
                boxShadow: '0 4px 15px rgba(15, 44, 99, 0.3)'
              }}
              onClick={addYear}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
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
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
              }}
              onClick={deleteYear}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <FontAwesomeIcon icon={faTrash} />
              Delete Year
            </button>
          </div>
        
        <div className="dashboard-content">
          <div className="years-grid">
            {yearLevels.map((level, index) => (
              <div
                key={index}
                className="year-card"
                onClick={() => navigateToSchedule(level.course, level.year)}
                style={{
                  background: level.course === 'bsit' 
                    ? 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)'
                    : 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)'
                }}
              >
                <FontAwesomeIcon 
                  icon={level.course === 'bsit' ? faGraduationCap : faCode} 
                />
                <div className="year-title">{level.title}</div>
                <div className="year-subtitle">{level.subtitle}</div>
              </div>
            ))}
          </div>
        </div>
        </div>

        {showAddYearPopup && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '15px',
              padding: '30px',
              width: '600px',
              maxWidth: '95vw',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '25px',
                borderBottom: '2px solid #f1f5f9',
                paddingBottom: '15px'
              }}>
                <h3 style={{
                  margin: 0,
                  color: '#1e293b',
                  fontSize: '20px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <FontAwesomeIcon icon={faPlus} style={{color: '#0f2c63'}} />
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
                    transition: 'all 0.3s ease'
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

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const yearData = {
                  course: formData.get('course'),
                  subtitle: formData.get('subtitle'),
                  year: formData.get('year')
                };
                handleAddYearSubmit(yearData);
              }}>
                <div style={{marginBottom: '20px'}}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Course *
                  </label>
                  <select
                    name="course"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#374151',
                      background: 'white',
                      transition: 'border-color 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0f2c63'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="">Select Course</option>
                    <option value="bsit">BSIT - Bachelor of Science in Information Technology</option>
                    <option value="bsemc-dat">BSEMC-DAT - BS in Entertainment & Multimedia Computing - Digital Animation Tech</option>
                  </select>
                </div>

                <div style={{marginBottom: '20px'}}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Subtitle *
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    placeholder="Enter subtitle"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#374151',
                      background: 'white',
                      transition: 'border-color 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0f2c63'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <div style={{marginBottom: '30px'}}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Year Level *
                  </label>
                  <select
                    name="year"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 15px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#374151',
                      background: 'white',
                      transition: 'border-color 0.3s ease',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0f2c63'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  >
                    <option value="">Select Year Level</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                  </select>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '15px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowAddYearPopup(false)}
                    style={{
                      padding: '12px 24px',
                      background: '#f1f5f9',
                      color: '#64748b',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#e2e8f0';
                      e.target.style.color = '#374151';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = '#f1f5f9';
                      e.target.style.color = '#64748b';
                    }}
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
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(15, 44, 99, 0.3)'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <FontAwesomeIcon icon={faPlus} style={{marginRight: '8px'}} />
                    Add Year
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default ManageSchedule;