import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGraduationCap, 
  faCode, 
  faCalendarAlt,
  faChevronRight 
} from '@fortawesome/free-solid-svg-icons';

const ManageSchedule = () => {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState(null);

  const courses = [
    {
      id: 'bsit',
      name: 'Bachelor of Science in Information Technology',
      shortName: 'BSIT',
      icon: faGraduationCap,
      gradient: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
    },
    {
      id: 'bsemc-dat',
      name: 'Bachelor of Science in Entertainment and Multimedia Computing',
      shortName: 'BSEMC-DAT',
      icon: faCode,
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    }
  ];

  const yearLevels = [
    { id: '1st year', label: '1st Year', subtitle: 'First Year Students' },
    { id: '2nd year', label: '2nd Year', subtitle: 'Second Year Students' },
    { id: '3rd year', label: '3rd Year', subtitle: 'Third Year Students' },
    { id: '4th year', label: '4th Year', subtitle: 'Fourth Year Students' }
  ];

  const navigateToSchedule = (course, year) => {
    navigate(`/admin/schedule/${course}/${year.replace(/\s+/g, '').toLowerCase()}`);
  };

  const currentCourse = courses.find(c => c.id === selectedCourse);

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        <Header title="Manage Schedule" />
        <div className="dashboard-content">
          {/* Welcome Section */}
          <div className="welcome-section" style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <FontAwesomeIcon 
                icon={faCalendarAlt} 
                style={{ fontSize: 32, color: '#f97316' }}
              />
              <h2 style={{ margin: 0 }}>Schedule Management</h2>
            </div>
            <p style={{ margin: 0 }}>Select a course and year level to manage class schedules</p>
          </div>

          {/* Course Selection */}
          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '18px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            borderLeft: '5px solid #f97316',
            marginBottom: '24px',
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
              Select Course
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course.id)}
                  style={{
                    padding: '24px 28px',
                    background: selectedCourse === course.id ? course.gradient : '#f9fafb',
                    color: selectedCourse === course.id ? 'white' : '#374151',
                    border: selectedCourse === course.id ? 'none' : '2px solid #e5e7eb',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '12px',
                    transition: 'all 0.3s ease',
                    textAlign: 'left',
                  }}
                  onMouseOver={(e) => {
                    if (selectedCourse !== course.id) {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedCourse !== course.id) {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <FontAwesomeIcon icon={course.icon} style={{ fontSize: 32 }} />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                      {course.shortName}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      opacity: 0.8,
                      fontWeight: '400' 
                    }}>
                      {course.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Year Level Selection - Only shows when course is selected */}
          {selectedCourse && (
            <div style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderLeft: '5px solid #f97316',
              marginBottom: '24px',
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
                Select Year Level
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '20px' 
              }}>
                {yearLevels.map((year) => (
                  <button
                    key={year.id}
                    onClick={() => navigateToSchedule(selectedCourse, year.id)}
                    style={{
                      padding: '28px',
                      background: currentCourse.gradient,
                      color: 'white',
                      border: 'none',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: '700' }}>
                        {year.label}
                      </div>
                      <FontAwesomeIcon 
                        icon={faChevronRight} 
                        style={{ fontSize: 20, opacity: 0.8 }} 
                      />
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>
                      {year.subtitle}
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      right: '-20px',
                      width: '100px',
                      height: '100px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                    }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Instructions when no course selected */}
          {!selectedCourse && (
            <div style={{
              background: '#fff',
              padding: '60px 30px',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              textAlign: 'center',
              borderLeft: '5px solid #f97316',
            }}>
              <FontAwesomeIcon 
                icon={faCalendarAlt} 
                style={{ fontSize: 48, color: '#f97316', marginBottom: '16px' }} 
              />
              <h3 style={{ color: '#1e293b', fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                Get Started
              </h3>
              <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
                Please select a course above to view and manage year level schedules
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageSchedule;
