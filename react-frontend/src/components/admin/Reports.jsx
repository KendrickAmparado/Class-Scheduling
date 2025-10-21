import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar,
  faDownload,
  faUsers,
  faDoorOpen,
  faUser,
  faGraduationCap,
  faCode
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/Reports.css';

const Reports = () => {
  const [reportData, setReportData] = useState({});

  // Time blocks for reports
  const timeBlocks = useMemo(() => [
    '7:30 - 10:00',
    '10:00 - 12:30',
    '12:30 - 3:00',
    '3:00 - 5:30',
    '5:30 - 8:00'
  ], []);

  // Entities for comprehensive reporting
  const entities = useMemo(() => [
    // Course Sections
    { id: 'bsit-1a', name: 'BSIT-1A', type: 'section', course: 'bsit', icon: faGraduationCap },
    { id: 'bsit-1b', name: 'BSIT-1B', type: 'section', course: 'bsit', icon: faGraduationCap },
    { id: 'bsit-1c', name: 'BSIT-1C', type: 'section', course: 'bsit', icon: faGraduationCap },
    { id: 'bsit-1d', name: 'BSIT-1D', type: 'section', course: 'bsit', icon: faGraduationCap },
    { id: 'bsit-1e', name: 'BSIT-1E', type: 'section', course: 'bsit', icon: faGraduationCap },
    { id: 'bsit-1f', name: 'BSIT-1F', type: 'section', course: 'bsit', icon: faGraduationCap },
    { id: 'bsemc-1a', name: 'BSEMC-1A', type: 'section', course: 'bsemc-dat', icon: faCode },
    { id: 'bsemc-1b', name: 'BSEMC-1B', type: 'section', course: 'bsemc-dat', icon: faCode },

    // ComLabs
    { id: 'comlab-1', name: 'ComLab 1', type: 'comlab', icon: faDoorOpen },
    { id: 'comlab-2', name: 'ComLab 2', type: 'comlab', icon: faDoorOpen },
    { id: 'comlab-3', name: 'ComLab 3', type: 'comlab', icon: faDoorOpen },
    { id: 'comlab-4', name: 'ComLab 4', type: 'comlab', icon: faDoorOpen },
    { id: 'comlab-5', name: 'ComLab 5', type: 'comlab', icon: faDoorOpen },
    { id: 'comlab-6', name: 'ComLab 6', type: 'comlab', icon: faDoorOpen },

    // Instructors
    { id: 'instructor-1', name: 'Instructor 1', type: 'instructor', icon: faUser },
    { id: 'instructor-2', name: 'Instructor 2', type: 'instructor', icon: faUser },
    { id: 'instructor-3', name: 'Instructor 3', type: 'instructor', icon: faUser },
    { id: 'instructor-4', name: 'Instructor 4', type: 'instructor', icon: faUser },
    { id: 'instructor-5', name: 'Instructor 5', type: 'instructor', icon: faUser }
  ], []);

  useEffect(() => {
    // Load report data from localStorage
    const saved = localStorage.getItem('comprehensive-schedule');
    if (saved) {
      setReportData(JSON.parse(saved));
    } else {
      // Initialize with sample data for reports
      const sampleData = {};

      // Sample data for sections
      entities.filter(e => e.type === 'section').forEach(entity => {
        timeBlocks.forEach((time, timeIndex) => {
          if (Math.random() > 0.6) {
            sampleData[`${entity.id}-mth-${timeIndex}-subject`] = `${entity.course.toUpperCase()} Subject ${timeIndex + 1}`;
            sampleData[`${entity.id}-mth-${timeIndex}-section`] = entity.name;
            sampleData[`${entity.id}-mth-${timeIndex}-instructor`] = 'Dr. Sample Instructor';
          }
          if (Math.random() > 0.7) {
            sampleData[`${entity.id}-tf-${timeIndex}-subject`] = `${entity.course.toUpperCase()} Subject ${timeIndex + 1}`;
            sampleData[`${entity.id}-tf-${timeIndex}-section`] = entity.name;
            sampleData[`${entity.id}-tf-${timeIndex}-instructor`] = 'Prof. Sample Instructor';
          }
        });
      });

      // Sample data for comlabs
      entities.filter(e => e.type === 'comlab').forEach(entity => {
        timeBlocks.forEach((time, timeIndex) => {
          if (Math.random() > 0.5) {
            sampleData[`${entity.id}-mth-${timeIndex}-subject`] = `Computer Lab Session ${timeIndex + 1}`;
            sampleData[`${entity.id}-mth-${timeIndex}-section`] = entity.name;
            sampleData[`${entity.id}-mth-${timeIndex}-instructor`] = 'Lab Instructor';
          }
          if (Math.random() > 0.6) {
            sampleData[`${entity.id}-tf-${timeIndex}-subject`] = `Computer Lab Session ${timeIndex + 1}`;
            sampleData[`${entity.id}-tf-${timeIndex}-section`] = entity.name;
            sampleData[`${entity.id}-tf-${timeIndex}-instructor`] = 'Lab Instructor';
          }
        });
      });

      // Sample data for instructors
      entities.filter(e => e.type === 'instructor').forEach(entity => {
        timeBlocks.forEach((time, timeIndex) => {
          if (Math.random() > 0.4) {
            sampleData[`${entity.id}-mth-${timeIndex}-subject`] = `Teaching Session ${timeIndex + 1}`;
            sampleData[`${entity.id}-mth-${timeIndex}-section`] = 'Various Classes';
            sampleData[`${entity.id}-mth-${timeIndex}-instructor`] = entity.name;
          }
          if (Math.random() > 0.5) {
            sampleData[`${entity.id}-tf-${timeIndex}-subject`] = `Teaching Session ${timeIndex + 1}`;
            sampleData[`${entity.id}-tf-${timeIndex}-section`] = 'Various Classes';
            sampleData[`${entity.id}-tf-${timeIndex}-instructor`] = entity.name;
          }
        });
      });

      setReportData(sampleData);
      localStorage.setItem('comprehensive-schedule', JSON.stringify(sampleData));
    }
  }, [entities, timeBlocks]);

  const downloadReport = () => {
    alert('Download functionality would export the selected report as PDF or Excel file.');
  };

  const getCellValue = (entityId, dayGroup, timeIndex, field) => {
    return reportData[`${entityId}-${dayGroup}-${timeIndex}-${field}`] || '';
  };

  const getEntityIcon = (entity) => {
    return entity.icon;
  };

  const getEntityColor = (entity) => {
    if (entity.type === 'section') {
      return entity.course === 'bsit' ? '#0f2c63' : '#7c3aed';
    } else if (entity.type === 'comlab') {
      return '#0f2c63';
    } else {
      return '#059669';
    }
  };

  const calculateStatistics = () => {
    const stats = {
      totalSections: entities.filter(e => e.type === 'section').length,
      totalComLabs: entities.filter(e => e.type === 'comlab').length,
      totalInstructors: entities.filter(e => e.type === 'instructor').length,
      totalSchedules: Object.keys(reportData).length
    };
    return stats;
  };

  const stats = calculateStatistics();

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Reports" />

        <div className="dashboard-content">
          <div className="reports-container">
            <div className="reports-header">
              <div className="reports-title">
                <FontAwesomeIcon
                  icon={faChartBar}
                  style={{ color: '#f97316', fontSize: '32px' }}
                />
                <div>
                  <h2>Comprehensive Reports</h2>
                  <p>View and analyze all scheduling data</p>
                </div>
              </div>

              <div className="reports-actions">
                <button className="reports-btn btn-download" onClick={downloadReport}>
                  <FontAwesomeIcon icon={faDownload} /> Download Report
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="statistics-grid">
              <div className="stat-card">
                <FontAwesomeIcon icon={faGraduationCap} className="stat-icon" />
                <div className="stat-content">
                  <h3>{stats.totalSections}</h3>
                  <p>Total Sections</p>
                </div>
              </div>
              <div className="stat-card">
                <FontAwesomeIcon icon={faDoorOpen} className="stat-icon" />
                <div className="stat-content">
                  <h3>{stats.totalComLabs}</h3>
                  <p>Computer Labs</p>
                </div>
              </div>
              <div className="stat-card">
                <FontAwesomeIcon icon={faUsers} className="stat-icon" />
                <div className="stat-content">
                  <h3>{stats.totalInstructors}</h3>
                  <p>Instructors</p>
                </div>
              </div>
            </div>

            {/* Report Content */}
            <div className="report-content">
              <h3 className="report-section-title">
                Complete Schedule Overview
              </h3>

              <div className="report-table" style={{ maxHeight: '60vh', overflow: 'auto' }}>
                {/* Monday-Thursday Section */}
                <div className="day-group-section">
                  <h4 className="day-group-header">Monday - Thursday Schedules</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Entity</th>
                        <th>Time</th>
                        <th>Subject Code</th>
                        <th>Section/Room</th>
                        <th>Instructor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entities.map(entity =>
                        timeBlocks.map((time, timeIndex) => (
                          <tr key={`${entity.id}-mth-${timeIndex}`}>
                            <td className="entity-column" style={{
                              background: '#f8fafc',
                              fontWeight: '600',
                              color: getEntityColor(entity),
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '12px 8px'
                            }}>
                              <FontAwesomeIcon icon={getEntityIcon(entity)} style={{ fontSize: '14px' }} />
                              {entity.name}
                            </td>
                            <td className="time-column">{time}</td>
                            <td
                              className={`${getCellValue(entity.id, 'mth', timeIndex, 'subject') ? 'subject-cell' : ''}`}
                            >
                              {getCellValue(entity.id, 'mth', timeIndex, 'subject')}
                            </td>
                            <td
                              className={`${getCellValue(entity.id, 'mth', timeIndex, 'section') ? 'subject-cell' : ''}`}
                            >
                              {getCellValue(entity.id, 'mth', timeIndex, 'section')}
                            </td>
                            <td
                              className={`${getCellValue(entity.id, 'mth', timeIndex, 'instructor') ? 'subject-cell' : ''}`}
                            >
                              {getCellValue(entity.id, 'mth', timeIndex, 'instructor')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Tuesday-Friday Section */}
                <div className="day-group-section">
                  <h4 className="day-group-header">Tuesday - Friday Schedules</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Entity</th>
                        <th>Time</th>
                        <th>Subject Code</th>
                        <th>Section/Room</th>
                        <th>Instructor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entities.map(entity =>
                        timeBlocks.map((time, timeIndex) => (
                          <tr key={`${entity.id}-tf-${timeIndex}`}>
                            <td className="entity-column" style={{
                              background: '#f8fafc',
                              fontWeight: '600',
                              color: getEntityColor(entity),
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '12px 8px'
                            }}>
                              <FontAwesomeIcon icon={getEntityIcon(entity)} style={{ fontSize: '14px' }} />
                              {entity.name}
                            </td>
                            <td className="time-column">{time}</td>
                            <td
                              className={`${getCellValue(entity.id, 'tf', timeIndex, 'subject') ? 'subject-cell' : ''}`}
                            >
                              {getCellValue(entity.id, 'tf', timeIndex, 'subject')}
                            </td>
                            <td
                              className={`${getCellValue(entity.id, 'tf', timeIndex, 'section') ? 'subject-cell' : ''}`}
                            >
                              {getCellValue(entity.id, 'tf', timeIndex, 'section')}
                            </td>
                            <td
                              className={`${getCellValue(entity.id, 'tf', timeIndex, 'instructor') ? 'subject-cell' : ''}`}
                            >
                              {getCellValue(entity.id, 'tf', timeIndex, 'instructor')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
