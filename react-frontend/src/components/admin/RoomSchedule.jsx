import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../common/BackButton.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrash,
  faDownload,
  faFilter,
  faDoorOpen
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/ScheduleCalendar.css';

const RoomSchedule = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [deleteMode, setDeleteMode] = useState(false);
  const [dayFilter, setDayFilter] = useState('all');
  const [scheduleData, setScheduleData] = useState({});

  const timeBlocks = [
    '7:30 - 10:00',
    '10:00 - 12:30',
    '12:30 - 3:00',
    '3:00 - 5:30',
    '5:30 - 8:00'
  ];

  const roomDetails = {
    'ComLab 1': {
      name: 'Computer Laboratory 1',
      color: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      icon: faDoorOpen
    },
    'ComLab 2': {
      name: 'Computer Laboratory 2',
      color: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      icon: faDoorOpen
    },
    'ComLab 3': {
      name: 'Computer Laboratory 3',
      color: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      icon: faDoorOpen
    },
    'ComLab 4': {
      name: 'Computer Laboratory 4',
      color: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      icon: faDoorOpen
    },
    'ComLab 5': {
      name: 'Computer Laboratory 5',
      color: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      icon: faDoorOpen
    },
    'ComLab 6': {
      name: 'Computer Laboratory 6',
      color: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      icon: faDoorOpen
    },
    'ComLab 7': {
      name: 'Computer Laboratory 7',
      color: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      icon: faDoorOpen
    },
    'ComLab 8': {
      name: 'Computer Laboratory 8',
      color: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      icon: faDoorOpen
    },
    'ComLab 9': {
      name: 'Computer Laboratory 9',
      color: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      icon: faDoorOpen
    },
    'ComLab 10': {
      name: 'Computer Laboratory 10',
      color: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      icon: faDoorOpen
    },
    'ComLab 11': {
      name: 'Computer Laboratory 11',
      color: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      icon: faDoorOpen
    },
    'ComLab 12': {
      name: 'Computer Laboratory 12',
      color: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      icon: faDoorOpen
    }
  };

  useEffect(() => {
    // Load saved schedule data
    const saved = localStorage.getItem(`room-schedule-${roomId}`);
    if (saved) {
      setScheduleData(JSON.parse(saved));
    }
  }, [roomId]);

  const addNewClass = () => {
    alert('Add New Class functionality would open a form to add a new class to the room schedule.');
  };

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
  };

  const downloadSchedule = () => {
    alert('Download functionality would export the room schedule as PDF or Excel file.');
  };

  const filterByDay = (selectedFilter) => {
    setDayFilter(selectedFilter);
  };

  const updateCell = (dayGroup, timeIndex, field, value) => {
    const newData = {
      ...scheduleData,
      [`${dayGroup}-${timeIndex}-${field}`]: value
    };
    setScheduleData(newData);
    // Save to localStorage
    localStorage.setItem(`room-schedule-${roomId}`, JSON.stringify(newData));
  };

  const getCellValue = (dayGroup, timeIndex, field) => {
    return scheduleData[`${dayGroup}-${timeIndex}-${field}`] || '';
  };

  const shouldShowSection = (section) => {
    if (dayFilter === 'all') return true;
    return section === dayFilter;
  };

  const handleCellBlur = (e, dayGroup, timeIndex, field) => {
    const value = e.target.textContent;
    updateCell(dayGroup, timeIndex, field, value);
  };

  const handleCellClick = (dayGroup, timeIndex, field) => {
    if (deleteMode && getCellValue(dayGroup, timeIndex, field)) {
      if (window.confirm('Delete this entry?')) {
        updateCell(dayGroup, timeIndex, field, '');
      }
    }
  };

  const formatRoomDisplay = (roomParam) => {
    return roomParam.replace(/(\d+)/, ' $1');
  };

  return (
    <div className="schedule-page">
      <BackButton onClick={() => navigate('/admin/room-management')} />

      <div className="dashboard-container">
        <main className="main-content full-width">
          <div className="dashboard-content">
            <div className="schedule-container">
              <div className="schedule-header">
                <div className="schedule-title">
                  <FontAwesomeIcon
                    icon={roomDetails[roomId]?.icon || faDoorOpen}
                    style={{ color: '#f97316', fontSize: '32px' }}
                  />
                  <div>
                    <h2>{formatRoomDisplay(roomId)} Schedule</h2>
                    <p>{roomDetails[roomId]?.name || 'Computer Laboratory'}</p>
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
                      <option value="all">All Schedules</option>
                      <option value="mth">Monday-Thursday Only</option>
                      <option value="tf">Tuesday-Friday Only</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="schedule-table">
                {/* Monday-Thursday Section */}
                {shouldShowSection('mth') && (
                  <div className="day-group-section">
                    <h3 className="day-group-header">Monday - Thursday</h3>
                    <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Subject Code</th>
                        <th>Section</th>
                        <th>Instructor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeBlocks.map((time, timeIndex) => (
                        <tr key={`mth-${timeIndex}`}>
                          <td className="time-column">{time}</td>
                          <td
                            contentEditable={!deleteMode}
                            className={`${getCellValue('mth', timeIndex, 'subject') ? 'subject-cell' : ''} ${deleteMode && getCellValue('mth', timeIndex, 'subject') ? 'delete-mode' : ''}`}
                            onBlur={(e) => handleCellBlur(e, 'mth', timeIndex, 'subject')}
                            onClick={() => handleCellClick('mth', timeIndex, 'subject')}
                            suppressContentEditableWarning={true}
                            dangerouslySetInnerHTML={{
                              __html: getCellValue('mth', timeIndex, 'subject')
                            }}
                          />
                          <td
                            contentEditable={!deleteMode}
                            className={`${getCellValue('mth', timeIndex, 'section') ? 'subject-cell' : ''} ${deleteMode && getCellValue('mth', timeIndex, 'section') ? 'delete-mode' : ''}`}
                            onBlur={(e) => handleCellBlur(e, 'mth', timeIndex, 'section')}
                            onClick={() => handleCellClick('mth', timeIndex, 'section')}
                            suppressContentEditableWarning={true}
                            dangerouslySetInnerHTML={{
                              __html: getCellValue('mth', timeIndex, 'section')
                            }}
                          />
                          <td
                            contentEditable={!deleteMode}
                            className={`${getCellValue('mth', timeIndex, 'instructor') ? 'subject-cell' : ''} ${deleteMode && getCellValue('mth', timeIndex, 'instructor') ? 'delete-mode' : ''}`}
                            onBlur={(e) => handleCellBlur(e, 'mth', timeIndex, 'instructor')}
                            onClick={() => handleCellClick('mth', timeIndex, 'instructor')}
                            suppressContentEditableWarning={true}
                            dangerouslySetInnerHTML={{
                              __html: getCellValue('mth', timeIndex, 'instructor')
                            }}
                          />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}

                {/* Tuesday-Friday Section */}
                {shouldShowSection('tf') && (
                  <div className="day-group-section">
                    <h3 className="day-group-header">Tuesday - Friday</h3>
                    <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Subject Code</th>
                        <th>Section</th>
                        <th>Instructor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeBlocks.map((time, timeIndex) => (
                        <tr key={`tf-${timeIndex}`}>
                          <td className="time-column">{time}</td>
                          <td
                            contentEditable={!deleteMode}
                            className={`${getCellValue('tf', timeIndex, 'subject') ? 'subject-cell' : ''} ${deleteMode && getCellValue('tf', timeIndex, 'subject') ? 'delete-mode' : ''}`}
                            onBlur={(e) => handleCellBlur(e, 'tf', timeIndex, 'subject')}
                            onClick={() => handleCellClick('tf', timeIndex, 'subject')}
                            suppressContentEditableWarning={true}
                            dangerouslySetInnerHTML={{
                              __html: getCellValue('tf', timeIndex, 'subject')
                            }}
                          />
                          <td
                            contentEditable={!deleteMode}
                            className={`${getCellValue('tf', timeIndex, 'section') ? 'subject-cell' : ''} ${deleteMode && getCellValue('tf', timeIndex, 'section') ? 'delete-mode' : ''}`}
                            onBlur={(e) => handleCellBlur(e, 'tf', timeIndex, 'section')}
                            onClick={() => handleCellClick('tf', timeIndex, 'section')}
                            suppressContentEditableWarning={true}
                            dangerouslySetInnerHTML={{
                              __html: getCellValue('tf', timeIndex, 'section')
                            }}
                          />
                          <td
                            contentEditable={!deleteMode}
                            className={`${getCellValue('tf', timeIndex, 'instructor') ? 'subject-cell' : ''} ${deleteMode && getCellValue('tf', timeIndex, 'instructor') ? 'delete-mode' : ''}`}
                            onBlur={(e) => handleCellBlur(e, 'tf', timeIndex, 'instructor')}
                            onClick={() => handleCellClick('tf', timeIndex, 'instructor')}
                            suppressContentEditableWarning={true}
                            dangerouslySetInnerHTML={{
                              __html: getCellValue('tf', timeIndex, 'instructor')
                            }}
                          />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RoomSchedule;