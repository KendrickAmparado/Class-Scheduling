import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../common/BackButton.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTrash, 
  faDownload, 
  faFilter, 
  faGraduationCap, 
  faCode,
  faTimes 
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/ScheduleCalendar.css';const ScheduleCalendar = () => {
  const { course, year } = useParams();
  const navigate = useNavigate();
  const [deleteMode, setDeleteMode] = useState(false);
  const [dayFilter, setDayFilter] = useState('all');
  const [scheduleData, setScheduleData] = useState({});
  const [showAddClassPopup, setShowAddClassPopup] = useState(false);

  // Time slots from 7:30 AM to 9:00 PM
  const timeSlots = [
     '7:30 - 8:00', '8:00 - 8:30', '8:30 - 9:00',
      '9:00 - 9:30', '9:30 - 10:00', '10:00 - 10:30',
      '10:30 - 11:00', '11:00 - 11:30', '11:30 - 12:00',
      '12:00 - 12:30', '12:30 - 1:00', '1:00 - 1:30',
      '1:30 - 2:00', '2:00 - 2:30', '2:30 - 3:00',
      '3:00 - 3:30', '3:30 - 4:00', '4:00 - 4:30',
      '4:30 - 5:00', '5:00 - 5:30', '5:30 - 6:00',
      '6:00 - 6:30', '6:30 - 7:00', '7:00 - 7:30',
      '7:30 - 8:00', '8:00 - 8:30', '8:30 - 9:00'
  ];

  // Grouped day display for the calendar
  const dayDisplayGroups = [
    { label: 'Monday/Thursday', days: ['monday', 'thursday'], group: 'mth' },
    { label: 'Tuesday/Friday', days: ['tuesday', 'friday'], group: 'tf' },
    { label: 'Wednesday', days: ['wednesday'], group: 'w' }
  ];

  const sections = ['A', 'B', 'C', 'D', 'E', 'F'];

  const courseDetails = {
    bsit: {
      name: 'Bachelor of Science in Information Technology',
      color: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      icon: faGraduationCap
    },
    'bsemc-dat': {
      name: 'Bachelor of Science in Entertainment and Multimedia Computing - Digital Animation Technology',
      color: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
      icon: faCode
    }
  };

  // Sample instructor data
  const instructors = [
    { id: '10001', name: 'Instructor 1', email: 'Instructor1@buksu.edu.ph' },
    { id: '10002', name: 'Instructor 2', email: 'Instructor2@buksu.edu.ph' },
    { id: '10003', name: 'Instructor 3', email: 'Instructor3@buksu.edu.ph' },
    { id: '10004', name: 'Instructor 4', email: 'Instructor4@buksu.edu.ph' },
    { id: '10005', name: 'Instructor 5', email: 'Instructor5@buksu.edu.ph' }
  ];

  useEffect(() => {
    // Load saved schedule data
    const saved = localStorage.getItem(`schedule-${course}-${year}`);
    if (saved) {
      setScheduleData(JSON.parse(saved));
    }
  }, [course, year]);

  const addNewClass = () => {
    setShowAddClassPopup(true);
  };

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
  };

  const downloadSchedule = () => {
    alert('Download functionality would export the schedule as PDF or Excel file.');
  };

  const handleAddClassSubmit = (classData) => {
    // Add logic to add the new class to the system
    setShowAddClassPopup(false);
    alert(`Class added successfully!\nSection Code: ${classData.sectionCode}\nSubject: ${classData.subjectName}\nDay: ${classData.day}\nStart Time: ${classData.startTime}\nEnd Time: ${classData.endTime}\nInstructor: ${classData.instructor}`);
  };

  const filterByDay = (selectedFilter) => {
    setDayFilter(selectedFilter);
  };

  const updateCell = (day, timeIndex, section, value) => {
    const newData = {
      ...scheduleData,
      [`${day}-${timeIndex}-${section}`]: value
    };
    setScheduleData(newData);
    // Save to localStorage
    localStorage.setItem(`schedule-${course}-${year}`, JSON.stringify(newData));
  };

  const getCellValue = (day, timeIndex, section) => {
    return scheduleData[`${day}-${timeIndex}-${section}`] || '';
  };

  const handleCellBlur = (e, day, timeIndex, section) => {
    const value = e.target.textContent;
    updateCell(day, timeIndex, section, value);
  };

  const handleCellClick = (day, timeIndex, section) => {
    if (deleteMode && getCellValue(day, timeIndex, section)) {
      if (window.confirm('Delete this class?')) {
        updateCell(day, timeIndex, section, '');
      }
    }
  };

  const formatYearDisplay = (yearParam) => {
    return yearParam.replace(/(\d+)/, '$1 ').replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  return (
    <div className="schedule-page">
      <BackButton onClick={() => navigate('/admin/manage-schedule')} />
      
      <div className="dashboard-container">
        <main className="main-content full-width">
          <div className="dashboard-content">
            <div className="schedule-container">
              <div className="schedule-header">
                <div className="schedule-title">
                  <FontAwesomeIcon 
                    icon={courseDetails[course]?.icon || faGraduationCap} 
                    style={{ color: '#f97316', fontSize: '32px' }}
                  />
                  <div>
                    <h2>{course.toUpperCase()} - {formatYearDisplay(year)} Schedule</h2>
                    <p>{courseDetails[course]?.name || 'Course Information'}</p>
                  </div>
                </div>
                
                <div className="schedule-actions">
                  <button className="schedule-btn btn-add" onClick={addNewClass}>
                    <FontAwesomeIcon icon={faPlus} /> Add Class
                  </button>
                  <button 
                    className={`schedule-btn btn-delete ${deleteMode ? 'active' : ''}`}
                    onClick={toggleDeleteMode}
                    style={deleteMode ? {
                      background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                    } : {}}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    {deleteMode ? ' Cancel' : ' Delete'}
                  </button>
                  <button className="schedule-btn btn-download" onClick={downloadSchedule}>
                    <FontAwesomeIcon icon={faDownload} /> Download
                  </button>
                  
                  {/* Day Filter */}
                  <div className="schedule-filter-inline">
                    <FontAwesomeIcon icon={faFilter} />
                    <select 
                      className="filter-dropdown" 
                      value={dayFilter}
                      onChange={(e) => filterByDay(e.target.value)}
                    >
                      <option value="all">All Days</option>
                      <option value="mth">Monday/Thursday</option>
                      <option value="w">Wednesday</option>
                      <option value="tf">Tuesday/Friday</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="schedule-table">
                <table>
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Time</th>
                      {sections.map(section => (
                        <th key={section}>
                          {course.toUpperCase()}-{year.charAt(0).toUpperCase()}{section}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dayDisplayGroups.map(dayGroup => 
                      timeSlots.map((time, timeIndex) => (
                        <tr 
                          key={`${dayGroup.label}-${timeIndex}`}
                          className={dayFilter !== 'all' && dayFilter !== dayGroup.group ? 'hidden-row' : ''}
                          data-day-group={dayGroup.group}
                        >
                          <td className="day-column">
                            {dayGroup.label}
                          </td>
                          <td className="time-column">{time}</td>
                          {sections.map(section => (
                            <td
                              key={section}
                              contentEditable={!deleteMode}
                              className={`${getCellValue(dayGroup.days[0], timeIndex, section) && getCellValue(dayGroup.days[0], timeIndex, section) !== 'LUNCH BREAK' ? 'subject-cell' : ''} ${deleteMode && getCellValue(dayGroup.days[0], timeIndex, section) ? 'delete-mode' : ''}`}
                              onBlur={(e) => handleCellBlur(e, dayGroup.days[0], timeIndex, section)}
                              onClick={() => handleCellClick(dayGroup.days[0], timeIndex, section)}
                              suppressContentEditableWarning={true}
                              dangerouslySetInnerHTML={{
                                __html: getCellValue(dayGroup.days[0], timeIndex, section)
                              }}
                            />
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showAddClassPopup && (
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
                <FontAwesomeIcon icon={faPlus} style={{color: '#059669'}} />
                Add New Class Section
              </h3>
              <button
                onClick={() => setShowAddClassPopup(false)}
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
              const classData = {
                sectionCode: formData.get('sectionCode'),
                subjectName: formData.get('subjectName'),
                day: formData.get('day'),
                startTime: formData.get('startTime'),
                endTime: formData.get('endTime'),
                instructor: formData.get('instructor')
              };
              handleAddClassSubmit(classData);
            }}>
              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Section Code *
                </label>
                <input
                  type="text"
                  name="sectionCode"
                  placeholder="e.g., T111"
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
                  onFocus={(e) => e.target.style.borderColor = '#059669'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Subject Name *
                </label>
                <input
                  type="text"
                  name="subjectName"
                  placeholder="e.g., Introduction to Computing, Data Structures"
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
                  onFocus={(e) => e.target.style.borderColor = '#059669'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  Day *
                </label>
                <select
                  name="day"
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
                  onFocus={(e) => e.target.style.borderColor = '#059669'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="">Select Day</option>
                  <option value="Monday/Thursday">Monday/Thursday</option>
                  <option value="Tuesday/Friday">Tuesday/Friday</option>
                  <option value="Wednesday">Wednesday</option>
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
                  Start Time *
                </label>
                <input
                  type="text"
                  name="startTime"
                  placeholder="e.g., 9:00 AM"
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
                  onFocus={(e) => e.target.style.borderColor = '#059669'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  End Time *
                </label>
                <input
                  type="text"
                  name="endTime"
                  placeholder="e.g., 10:00 AM"
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
                  onFocus={(e) => e.target.style.borderColor = '#059669'}
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
                  Instructor *
                </label>
                <select
                  name="instructor"
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
                  onFocus={(e) => e.target.style.borderColor = '#059669'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="">Select Instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.name}>
                      {instructor.name} ({instructor.id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddClassPopup(false)}
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
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <FontAwesomeIcon icon={faPlus} style={{marginRight: '8px'}} />
                  Add Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ScheduleCalendar;