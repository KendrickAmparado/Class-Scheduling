import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGraduationCap,
  faCode,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';

const ScheduleManagement = () => {
  const navigate = useNavigate();

  const courses = [
    {
      id: 'bsit',
      name: 'BS Information Technology',
      shortName: 'BSIT',
      icon: faGraduationCap,
      gradient: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
    },
    {
      id: 'bsemc-dat',
      name: 'BS Entertainment and Multimedia Computing',
      shortName: 'BSEMC-DAT',
      icon: faCode,
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    }
  ];

  const yearLevels = [
    { id: '1styear', label: '1st Year', year: 1 },
    { id: '2ndyear', label: '2nd Year', year: 2 },
    { id: '3rdyear', label: '3rd Year', year: 3 },
    { id: '4thyear', label: '4th Year', year: 4 }
  ];

  const handleYearClick = (courseId, yearId) => {
    navigate(`/admin/schedule-management/${courseId}/${yearId}`);
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, padding: '1rem' }}>
        <Header title="Schedule Management" />
        <div className="dashboard-content">
          <div className="welcome-section">
            <h2>Schedule Management</h2>
            <p>Select a course and year level to manage schedules</p>
          </div>

          {courses.map((course) => (
            <div
              key={course.id}
              style={{
                background: '#fff',
                padding: '30px',
                borderRadius: '18px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                borderLeft: '5px solid #f97316',
                marginBottom: '30px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '24px',
                  paddingBottom: '20px',
                  borderBottom: '2px solid #f1f5f9',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    background: course.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <FontAwesomeIcon icon={course.icon} style={{ fontSize: 28, color: 'white' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                    {course.shortName}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                    {course.name}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px',
                }}
              >
                {yearLevels.map((year) => (
                  <button
                    key={year.id}
                    onClick={() => handleYearClick(course.id, year.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '24px 28px',
                      background: course.gradient,
                      color: 'white',
                      border: 'none',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      fontSize: '18px',
                      fontWeight: '700',
                      boxShadow: '0 6px 20px rgba(15, 44, 99, 0.15)',
                      transition: 'transform 0.18s cubic-bezier(.32,2,.55,.27)',
                      minHeight: '90px',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = '')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          fontSize: '32px',
                          fontWeight: '800',
                          width: '48px',
                          height: '48px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {year.year}
                      </div>
                      <span>{year.label}</span>
                    </div>
                    <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 20 }} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ScheduleManagement;
