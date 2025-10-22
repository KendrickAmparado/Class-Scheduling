import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../common/BackButton.jsx';
import ScheduleDisplay from '../common/ScheduleDisplay.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrash,
  faDownload,
  faFilter,
  faGraduationCap,
  faCode,
  faTimes,
  faCheckCircle,
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { generateTimeSlots, TIME_SLOT_CONFIGS } from '../../utils/timeUtils.js';
import '../../styles/ScheduleCalendar.css';

const ScheduleCalendar = () => {
  const { course, year } = useParams();
  const navigate = useNavigate();

  // Normalize year param to match database format (e.g., "1styear" -> "1st year")
  const formatYearParam = (yearParam) => {
    return yearParam.replace(/(\d+)(st|nd|rd|th)?year/i, '$1st year').toLowerCase();
  };

  const normalizedYear = formatYearParam(year);

  const [deleteMode, setDeleteMode] = useState(false);
  const [dayFilter, setDayFilter] = useState('all');
  const [scheduleData, setScheduleData] = useState([]);
  const [showAddClassPopup, setShowAddClassPopup] = useState(false);
  const [showAddSectionPopup, setShowAddSectionPopup] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [addingClass, setAddingClass] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, scheduleId: null });
  const [sections, setSections] = useState([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [sectionErrorMessage, setSectionErrorMessage] = useState('');

  // Use standardized time slots generation
  const timeSlots = generateTimeSlots(
    TIME_SLOT_CONFIGS.DETAILED.startHour,
    TIME_SLOT_CONFIGS.DETAILED.endHour,
    TIME_SLOT_CONFIGS.DETAILED.duration
  );

  const dayDisplayGroups = [
    { label: 'Monday/Thursday', days: ['monday', 'thursday'], group: 'mth' },
    { label: 'Tuesday/Friday', days: ['tuesday', 'friday'], group: 'tf' },
    { label: 'Wednesday', days: ['wednesday'], group: 'w' }
  ];

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
    async function fetchData() {
      setLoadingSchedules(true);
      setNotification({ show: false, type: '', message: '' });
      try {
        const schedulesRes = await axios.get(`http://localhost:5000/api/schedule?course=${course}&year=${normalizedYear}`);
        setScheduleData(Array.isArray(schedulesRes.data) ? schedulesRes.data : []);

        const instructorsRes = await axios.get('http://localhost:5000/api/instructors');
        setInstructors(Array.isArray(instructorsRes.data) ? instructorsRes.data : []);

        const roomsRes = await axios.get('http://localhost:5000/api/rooms');
        if (Array.isArray(roomsRes.data)) {
          setRooms(roomsRes.data);
        } else if (roomsRes.data.rooms && Array.isArray(roomsRes.data.rooms)) {
          setRooms(roomsRes.data.rooms);
        } else {
          setRooms([]);
        }
      } catch (error) {
        setNotification({ show: true, type: 'error', message: 'Error fetching data.' });
        setScheduleData([]);
        setInstructors([]);
        setRooms([]);
      } finally {
        setLoadingSchedules(false);
        setLoadingInstructors(false);
        setLoadingRooms(false);
      }
    }

    async function fetchSections() {
      try {
        const res = await axios.get(`http://localhost:5000/api/sections?course=${course}&year=${normalizedYear}`);
        const sortedSections = (Array.isArray(res.data) ? res.data : []).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setSections(sortedSections);
      } catch (error) {
        showNotification('error', 'Error fetching sections.');
        setSections([]);
      }
    }

    fetchData();
    fetchSections();
  }, [course, normalizedYear]);


  const formatYearDisplay = (yearParam) => {
    return yearParam.replace(/(\d+)/, '$1 ').replace(/([a-z])([A-Z])/g, '$1 $2');
  };


  const filterByDay = (selectedFilter) => {
    setDayFilter(selectedFilter);
  };


  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
  };


  const addNewClass = () => {
    setNotification({ show: false, type: '', message: '' });
    setShowAddClassPopup(true);
  };


  const toggleDeleteMode = () => setDeleteMode(!deleteMode);


  const downloadSchedule = () => alert('Download functionality would export the schedule as PDF or Excel');


  const timeStringToMinutes = (timeStr) => {
    if (!timeStr) return -1;
    
    // Handle format like "8:00 AM - 8:30 AM" by taking the first part
    const cleanTime = timeStr.trim().split(' - ')[0];
    let [time, modifier] = cleanTime.split(' ');
    if (!modifier) return -1;
    
    let [h, m] = time.split(':').map(Number);
    if (modifier.toLowerCase() === 'pm' && h !== 12) h += 12;
    if (modifier.toLowerCase() === 'am' && h === 12) h = 0;
    return h * 60 + (m || 0);
  };


  const hasConflict = (newSchedule) => {
    const newDays = newSchedule.day.toLowerCase().split('/').map(d => d.trim());
    const newStart = timeStringToMinutes(newSchedule.startTime);
    const newEnd = timeStringToMinutes(newSchedule.endTime);
    if (newStart === -1 || newEnd === -1) return false;
    return scheduleData.some(existing => {
      if (existing.section !== newSchedule.section) return false;
      const existingDays = existing.day.toLowerCase().split('/').map(d => d.trim());
      if (!existingDays.some(d => newDays.includes(d))) return false;
      const [exStartTime, exEndTime] = existing.time.split(' - ').map(t => t.trim());
      const exStart = timeStringToMinutes(exStartTime);
      const exEnd = timeStringToMinutes(exEndTime);
      if (exStart === -1 || exEnd === -1) return false;
      return newStart < exEnd && newEnd > exStart;
    });
  };


  const confirmDelete = async () => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/schedule/${deleteConfirm.scheduleId}`);
      if (response.data.success) {
        showNotification('success', 'Schedule deleted successfully.');
        const res = await axios.get(`http://localhost:5000/api/schedule?course=${course}&year=${normalizedYear}`);
        setScheduleData(res.data);
      } else {
        showNotification('error', response.data.message || 'Failed to delete schedule.');
      }
    } catch (err) {
      showNotification('error', 'Error deleting schedule.');
      console.error('Delete schedule error:', err);
    }
    setDeleteConfirm({ open: false, scheduleId: null });
  };


  const handleAddClassSubmit = async (classData) => {
    setAddingClass(true);
    setNotification({ show: false, type: '', message: '' });
    if (hasConflict(classData)) {
      setAddingClass(false);
      showNotification(
        'error',
        `Schedule conflict detected for section ${classData.section} on ${classData.day} at the selected time.`
      );
      return;
    }
    const payload = {
      course,
      year: normalizedYear,
      section: classData.section,
      subject: classData.subjectName,
      day: classData.day,
      time: `${classData.startTime} - ${classData.endTime}`,
      instructor: classData.instructor,
      room: classData.room,
    };
    try {
      const res = await axios.post('http://localhost:5000/api/schedule/create', payload);
      if (res.data.success) {
        showNotification('success', 'Schedule created successfully!');
        setShowAddClassPopup(false);
        const res2 = await axios.get(`http://localhost:5000/api/schedule?course=${course}&year=${normalizedYear}`);
        setScheduleData(res2.data);
      } else {
        showNotification('error', res.data.message || 'Failed to add schedule.');
      }
    } catch (err) {
      showNotification('error', 'Error adding schedule.');
      console.error(err);
    }
    setAddingClass(false);
  };


  const handleAddSectionSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = newSectionName.trim();
  
    if (!trimmedName) {
      setSectionErrorMessage('Section name cannot be empty.');
      return;
    }
  
    // Check if the section already exists (case-insensitive)
    const sectionExists = sections.some(
      (section) => section.name.toLowerCase() === trimmedName.toLowerCase()
    );
  
    if (sectionExists) {
      setSectionErrorMessage("Can't add the same section.");
      return;
    }
  
    setSectionErrorMessage('');  // clear any previous error
    setAddingSection(true);
  
    try {
      const res = await axios.post('http://localhost:5000/api/sections/create', {
        course,
        year: normalizedYear,
        name: trimmedName,
      });
      if (res.data.success) {
        showNotification('success', 'Section added successfully!');
        setNewSectionName('');
        setShowAddSectionPopup(false);
        const refreshedSections = await axios.get(`http://localhost:5000/api/sections?course=${course}&year=${normalizedYear}`);
        setSections(refreshedSections.data || []);
      } else {
        showNotification('error', res.data.message || 'Failed to add section.');
      }
    } catch (error) {
      showNotification('error', 'Error adding section.');
      console.error(error);
    }
    setAddingSection(false);
  };
  

  // Debug logs before rendering
  console.log('Sections to display:', sections);
  console.log('Schedule data:', scheduleData);

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
                    <h2>
                      {course.toUpperCase()} - {formatYearDisplay(year)} Schedule
                    </h2>
                    <p>{courseDetails[course]?.name || 'Course Information'}</p>
                  </div>
                </div>

                <div className="schedule-actions">
                  <button className="schedule-btn btn-add" onClick={addNewClass} disabled={addingClass}>
                    <FontAwesomeIcon icon={faPlus} /> Add Schedule
                  </button>
                  <button
                    className="schedule-btn btn-add"
                    onClick={() => setShowAddSectionPopup(true)}
                    disabled={addingSection}
                    style={{ marginLeft: '10px' }}
                  >
                    <FontAwesomeIcon icon={faPlus} style={{ marginRight: '6px' }} />
                    Add Section
                  </button>
                  <button
                    className={`schedule-btn btn-delete ${deleteMode ? 'active' : ''}`}
                    onClick={toggleDeleteMode}
                    style={deleteMode ? { background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' } : {}}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    {deleteMode ? ' Cancel' : ' Delete'}
                  </button>
                  <button className="schedule-btn btn-download" onClick={downloadSchedule}>
                    <FontAwesomeIcon icon={faDownload} /> Download
                  </button>
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

              {loadingSchedules || loadingInstructors || loadingRooms ? (
                <p className="info-message">Loading data, please wait...</p>
              ) : null}

              <div className="schedule-table-container">
                <div className="schedule-table">
                  <table>
                    <thead>
  <tr>
    <th>Day</th>
    <th>Time</th>
    {sections.length === 0 ? (
      <th>No Sections Yet</th>
    ) : (
      sections.map((section) => (
        <th key={section._id}>
          {course.toUpperCase()}-{year.charAt(0).toUpperCase()}
          {section.name}
        </th>
      ))
    )}
  </tr>
</thead>
<tbody>
  {dayDisplayGroups.map(dayGroup =>
    timeSlots.map((time, timeIndex) => (
      <tr key={`${dayGroup.label}-${timeIndex}`} className={dayFilter !== 'all' && dayFilter !== dayGroup.group ? 'hidden-row' : ''} data-day-group={dayGroup.group}>
        <td className="day-column">{dayGroup.label}</td>
        <td className="time-column">{time}</td>
        {sections.length === 0 ? (
          <td style={{ textAlign: 'center' }}>—</td>
        ) : (
          sections.map(section => {
            const schedule = scheduleData.find(sched => {
              if (sched.section !== section.name) return false;

              const schedDayStrs = sched.day.toLowerCase().replace(/\s/g, '').split('/');
              const slotGroupDaysSet = new Set(dayGroup.days.map(d => d.toLowerCase().replace(/\s/g, '')));
              const hasDayOverlap = schedDayStrs.some(d => slotGroupDaysSet.has(d));
              if (!hasDayOverlap) return false;

              const [schedStart, schedEnd] = sched.time.split(' - ').map(x => x.trim());
              const schedStartMin = timeStringToMinutes(schedStart);
              const schedEndMin = timeStringToMinutes(schedEnd);

              const [slotStart, slotEnd] = time.split(' - ').map(x => x.trim());
              const slotStartMin = timeStringToMinutes(slotStart);
              const slotEndMin = timeStringToMinutes(slotEnd);

              return schedStartMin <= slotStartMin && slotEndMin <= schedEndMin;
            });

            let isFirstSlot = false;
            let rowSpan = 1;
            if (schedule) {
              const [schedStartStr, schedEndStr] = schedule.time.split(' - ').map(s => s.trim());
              const schedStartMin = timeStringToMinutes(schedStartStr);
              const schedEndMin = timeStringToMinutes(schedEndStr);

              let firstMatchingSlotIndex = -1;
              for (let i = 0; i < timeSlots.length; i++) {
                const [slotStart, slotEnd] = timeSlots[i].split(' - ').map(s => s.trim());
                const slotStartMin = timeStringToMinutes(slotStart);
                const slotEndMin = timeStringToMinutes(slotEnd);

                if (schedStartMin <= slotStartMin && slotEndMin <= schedEndMin) {
                  if (firstMatchingSlotIndex === -1) {
                    firstMatchingSlotIndex = i;
                  }
                }
              }
              isFirstSlot = (firstMatchingSlotIndex === timeIndex);

              if (isFirstSlot) {
                rowSpan = 0;
                for (let i = timeIndex; i < timeSlots.length; i++) {
                  const [slotStart, slotEnd] = timeSlots[i].split(' - ').map(s => s.trim());
                  const slotStartMin = timeStringToMinutes(slotStart);
                  const slotEndMin = timeStringToMinutes(slotEnd);

                  if (slotStartMin >= schedStartMin && slotEndMin <= schedEndMin) {
                    rowSpan++;
                  } else {
                    break;
                  }
                }
              }
            }

            if (schedule && isFirstSlot) {
              return (
                <td
                  key={section._id}
                  rowSpan={rowSpan}
                  className={`subject-cell ${deleteMode ? 'delete-mode' : ''}`}
                  onClick={() => {
                    if (deleteMode) setDeleteConfirm({ open: true, scheduleId: schedule._id });
                  }}
                  style={{
                    background: deleteMode
                      ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                      : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    borderLeft: deleteMode ? '4px solid #ef4444' : '4px solid #3b82f6',
                    color: deleteMode ? '#dc2626' : '#1e40af',
                    cursor: deleteMode ? 'pointer' : 'default',
                    position: 'relative',
                    minHeight: '60px',
                    verticalAlign: 'top',
                  }}
                >
                  <div style={{ padding: '8px', textAlign: 'left' }}>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      marginBottom: '4px',
                      color: deleteMode ? '#dc2626' : '#1e40af'
                    }}>
                      {schedule.subject}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      marginBottom: '2px',
                      color: deleteMode ? '#b91c1c' : '#1e40af'
                    }}>
                      {schedule.instructor}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: deleteMode ? '#991b1b' : '#1e40af',
                      fontStyle: 'italic'
                    }}>
                      Room: {schedule.room}
                    </div>
                    {deleteMode && (
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#dc2626'
                      }}>
                        DELETE
                      </div>
                    )}
                  </div>
                </td>
              );
            } else {
              return (
                <td
                  key={`${section._id}-empty`}
                  style={{
                    background: '#ffffff',
                    minHeight: '60px',
                    verticalAlign: 'top',
                    border: '1px solid #f1f5f9'
                  }}
                />
              );
            }
          })
        )}
      </tr>
    ))
  )}
</tbody>

                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showAddClassPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <h3>
                <FontAwesomeIcon icon={faPlus} style={{ color: '#059669' }} /> Add Schedule
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowAddClassPopup(false)}
                disabled={addingClass}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const classData = {
                  section: formData.get('section'),
                  sectionCode: formData.get('sectionCode'),
                  subjectName: formData.get('subjectName'),
                  day: formData.get('day'),
                  startTime: formData.get('startTime'),
                  endTime: formData.get('endTime'),
                  instructor: formData.get('instructor'),
                  room: formData.get('room'),
                };
                handleAddClassSubmit(classData);
              }}
            >
              <div className="form-group">
                <label>Section *</label>
                <select name="section" required disabled={addingClass}>
                  <option value="">Select Section</option>
                  {sections.map((section) => (
                    <option key={section._id} value={section.name}>
                      {course.toUpperCase()}-{year.charAt(0).toUpperCase()}
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Section Code *</label>
                <input
                  name="sectionCode"
                  type="text"
                  placeholder="e.g., T111"
                  required
                  disabled={addingClass}
                />
              </div>
              <div className="form-group">
                <label>Subject Name *</label>
                <input
                  name="subjectName"
                  type="text"
                  placeholder="e.g., Introduction to Computing"
                  required
                  disabled={addingClass}
                />
              </div>
              <div className="form-group">
                <label>Day *</label>
                <select name="day" required disabled={addingClass}>
                  <option value="">Select Day</option>
                  <option value="Monday/Thursday">Monday/Thursday</option>
                  <option value="Tuesday/Friday">Tuesday/Friday</option>
                  <option value="Wednesday">Wednesday</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Time *</label>
                <input
                  name="startTime"
                  type="text"
                  placeholder="e.g., 9:00 AM"
                  pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$"
                  title="Enter time in HH:MM AM/PM format"
                  required
                  disabled={addingClass}
                />
              </div>
              <div className="form-group">
                <label>End Time *</label>
                <input
                  name="endTime"
                  type="text"
                  placeholder="e.g., 10:30 PM"
                  pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$"
                  title="Enter time in HH:MM AM/PM format"
                  required
                  disabled={addingClass}
                />
              </div>
              <div className="form-group">
                <label>Instructor *</label>
                <select name="instructor" required disabled={addingClass}>
                  <option value="">Select Instructor</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.name}>
                      {instructor.name} ({instructor.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Room *</label>
                <select name="room" required disabled={addingClass}>
                  <option value="">Select Room</option>
                  {Array.isArray(rooms) && rooms.length > 0 ? (
                    rooms.map((room) => (
                      <option key={room._id} value={room.room}>
                        {room.room}
                      </option>
                    ))
                  ) : (
                    <option disabled>No rooms available</option>
                  )}
                </select>
              </div>
              {notification.show && (
                <div className={`form-notification ${notification.type}`}>
                  <FontAwesomeIcon
                    icon={notification.type === 'success' ? faCheckCircle : faExclamationCircle}
                    style={{ marginRight: '8px' }}
                  />
                  {notification.message}
                </div>
              )}
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddClassPopup(false)} disabled={addingClass}>
                  Cancel
                </button>
                <button type="submit" disabled={addingClass}>
                  <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
                  {addingClass ? 'Adding...' : 'Add Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Add Section Popup */}
      {showAddSectionPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <h3>
                <FontAwesomeIcon icon={faPlus} style={{ color: '#059669' }} /> Add New Section
              </h3>
              <button
                className="close-btn"
                onClick={() => setShowAddSectionPopup(false)}
                disabled={addingSection}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={handleAddSectionSubmit}>
            <div className="form-group">
  <label>Section Name *</label>
  <input
    type="text"
    placeholder="e.g., A, B, C"
    value={newSectionName}
    onChange={(e) => {
      setNewSectionName(e.target.value);
      if (sectionErrorMessage) setSectionErrorMessage('');
    }}
    disabled={addingSection}
    required
  />
  {sectionErrorMessage && (
    <div className="form-notification error" style={{ marginTop: '8px' }}>
      <FontAwesomeIcon icon={faExclamationCircle} style={{ marginRight: '8px' }} />
      {sectionErrorMessage}
    </div>
  )}
</div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSectionPopup(false);
                    setNewSectionName('');
                  }}
                  disabled={addingSection}
                >
                  Cancel
                </button>
                <button type="submit" disabled={addingSection}>
                  {addingSection ? 'Adding...' : 'Add Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {deleteConfirm.open && (
        <div className="modal-overlay">
          <div className="modal-content">
            <p>Are you sure you want to delete this schedule?</p>
            <div className="modal-buttons">
              <button className="btn btn-confirm" onClick={confirmDelete}>
                Yes, Delete
              </button>
              <button
                className="btn btn-cancel"
                onClick={() => setDeleteConfirm({ open: false, scheduleId: null })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      <style>{`
        .form-notification {
          margin: 10px 0;
          padding: 10px;
          border-radius: 4px;
          font-weight: 600;
          display: flex;
          align-items: center;
        }
        .form-notification.success {
          background-color: #dbf4e7;
          color: #2d7a46;
        }
        .form-notification.error {
          background-color: #fdecea;
          color: #a12722;
        }
        .schedule-btn.btn-add, .schedule-btn.btn-delete, .schedule-btn.btn-download {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-weight: 600;
          margin-right: 10px;
          transition: background-color 0.3s;
        }
        .schedule-btn.btn-add {
          background-color: #059669;
        }
        .schedule-btn.btn-add:hover:not(:disabled) {
          background-color: #047857;
        }
        .schedule-btn.btn-delete {
          background-color: #dc2626;
        }
        .schedule-btn.btn-delete.active {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        }
        .schedule-btn.btn-delete:hover:not(:disabled) {
          background-color: #b91c1c;
        }
        .schedule-btn.btn-download {
          background-color: #2563eb;
        }
        .schedule-btn.btn-download:hover:not(:disabled) {
          background-color: #1d4ed8;
        }
        .modal-overlay {
          background: rgba(0, 0, 0, 0.6);
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 20px 30px;
          border-radius: 8px;
          width: 300px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          text-align: center;
          font-size: 16px;
        }
        .modal-buttons {
          margin-top: 20px;
          display: flex;
          justify-content: space-around;
        }
        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }
        .btn-confirm {
          background-color: #dc2626;
          color: white;
        }
        .btn-confirm:hover {
          background-color: #b91c1c;
        }
        .btn-cancel {
          background-color: #e5e7eb;
          color: #374151;
        }
        .btn-cancel:hover {
          background-color: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default ScheduleCalendar;
