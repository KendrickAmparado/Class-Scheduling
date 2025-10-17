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
  faCode 
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/ScheduleCalendar.css';const ScheduleCalendar = () => {
  const { course, year } = useParams();
  const navigate = useNavigate();
  const [deleteMode, setDeleteMode] = useState(false);
  const [dayFilter, setDayFilter] = useState('all');
  const [scheduleData, setScheduleData] = useState({});

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

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dayGroups = {
    monday: 'mth',
    tuesday: 'tf',
    wednesday: 'w',
    thursday: 'mth',
    friday: 'tf'
  };

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

  useEffect(() => {
    // Load saved schedule data
    const saved = localStorage.getItem(`schedule-${course}-${year}`);
    if (saved) {
      setScheduleData(JSON.parse(saved));
    }
  }, [course, year]);

  const addNewClass = () => {
    alert('Add New Class functionality would open a form to add a new class to the schedule.');
  };

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
  };

  const downloadSchedule = () => {
    alert('Download functionality would export the schedule as PDF or Excel file.');
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

  const shouldShowRow = (day) => {
    if (dayFilter === 'all') return true;
    return dayGroups[day] === dayFilter;
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
                      <option value="mth">MondayThursday</option>
                      <option value="w">Wednesday</option>
                      <option value="tf">TuesdayFriday</option>
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
                    {days.map(day => 
                      timeSlots.map((time, timeIndex) => (
                        <tr 
                          key={`${day}-${timeIndex}`}
                          className={!shouldShowRow(day) ? 'hidden-row' : ''}
                          data-day={day}
                          data-day-group={dayGroups[day]}
                        >
                          <td className="day-column">
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </td>
                          <td className="time-column">{time}</td>
                          {sections.map(section => (
                            <td
                              key={section}
                              contentEditable={!deleteMode}
                              className={`${getCellValue(day, timeIndex, section) && getCellValue(day, timeIndex, section) !== 'LUNCH BREAK' ? 'subject-cell' : ''} ${deleteMode && getCellValue(day, timeIndex, section) ? 'delete-mode' : ''}`}
                              onBlur={(e) => handleCellBlur(e, day, timeIndex, section)}
                              onClick={() => handleCellClick(day, timeIndex, section)}
                              suppressContentEditableWarning={true}
                              dangerouslySetInnerHTML={{
                                __html: getCellValue(day, timeIndex, section)
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
    </div>
  );
};

export default ScheduleCalendar;