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
  faTimes,
  faCheckCircle,
  faExclamationCircle,
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import '../../styles/ScheduleCalendar.css';

const ScheduleCalendar = () => {
  const { course, year } = useParams();
  const navigate = useNavigate();

  const [deleteMode, setDeleteMode] = useState(false);
  const [dayFilter, setDayFilter] = useState('all');
  const [scheduleData, setScheduleData] = useState([]);
  const [showAddClassPopup, setShowAddClassPopup] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [addingClass, setAddingClass] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, scheduleId: null });

  const timeSlots = [
    '7:30 AM - 8:00 AM',
    '8:00 AM - 8:30 AM',
    '8:30 AM - 9:00 AM',
    '9:00 AM - 9:30 AM',
    '9:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:00 AM - 11:30 AM',
    '11:30 AM - 12:00 PM',
    '12:00 PM - 12:30 PM',
    '12:30 PM - 1:00 PM',
    '1:00 PM - 1:30 PM',
    '1:30 PM - 2:00 PM',
    '2:00 PM - 2:30 PM',
    '2:30 PM - 3:00 PM',
    '3:00 PM - 3:30 PM',
    '3:30 PM - 4:00 PM',
    '4:00 PM - 4:30 PM',
    '4:30 PM - 5:00 PM',
    '5:00 PM - 5:30 PM',
    '5:30 PM - 6:00 PM',
    '6:00 PM - 6:30 PM',
    '6:30 PM - 7:00 PM',
    '7:00 PM - 7:30 PM',
    '7:30 PM - 8:00 PM',
    '8:00 PM - 8:30 PM',
    '8:30 PM - 9:00 PM'
  ];
  

  const dayDisplayGroups = [
    { label: 'Monday/Thursday', days: ['monday', 'thursday'], group: 'mth' },
    { label: 'Tuesday/Friday', days: ['tuesday', 'friday'], group: 'tf' },
    { label: 'Wednesday', days: ['wednesday'], group: 'w' },
  ];

  const sections = ['A', 'B', 'C', 'D', 'E', 'F'];

  const courseDetails = {
    bsit: {
      name: 'Bachelor of Science in Information Technology',
      color: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      icon: faGraduationCap,
    },
    'bsemc-dat': {
      name: 'Bachelor of Science in Entertainment and Multimedia Computing - Digital Animation Technology',
      color: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
      icon: faCode,
    },
  };

  useEffect(() => {
    async function fetchData() {
      setLoadingSchedules(true);
      setNotification({ show: false, type: '', message: '' });
      try {
        const schedulesRes = await axios.get(`http://localhost:5000/api/schedule?course=${course}&year=${year}`);
        setScheduleData(schedulesRes.data);

        const instructorsRes = await axios.get('http://localhost:5000/api/instructors');
        setInstructors(instructorsRes.data);

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
        console.error(error);
      } finally {
        setLoadingSchedules(false);
        setLoadingInstructors(false);
        setLoadingRooms(false);
      }
    }
    fetchData();
  }, [course, year]);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
  };

  const addNewClass = () => {
    setNotification({ show: false, type: '', message: '' });
    setShowAddClassPopup(true);
  };

  const toggleDeleteMode = () => setDeleteMode(!deleteMode);

  const downloadSchedule = () => alert('Download functionality would export the schedule as PDF or Excel file.');

  const timeStringToMinutes = (timeStr) => {
    if (!timeStr) return -1;
    let [time, modifier] = timeStr.trim().split(' ');
    if (!modifier) return -1;
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier.toLowerCase() === 'pm' && hours !== 12) hours += 12;
    if (modifier.toLowerCase() === 'am' && hours === 12) hours = 0;
    return hours * 60 + minutes;
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
        const res = await axios.get(`http://localhost:5000/api/schedule?course=${course}&year=${year}`);
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
      showNotification('error', `Schedule conflict detected for section ${classData.section} on ${classData.day} at the selected time.`);
      return;
    }
    const payload = {
      course,
      year,
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
        const res2 = await axios.get(`http://localhost:5000/api/schedule?course=${course}&year=${year}`);
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

  const filterByDay = (selectedFilter) => setDayFilter(selectedFilter);

  const formatYearDisplay = yearParam =>
    yearParam.replace(/(\d+)/, '$1 ').replace(/([a-z])([A-Z])/g, '$1 $2');

  // Robust cell matching: Only schedules found in DB are displayed
  function normalizeSlotTime(str) {
    if (!str) return -1;
    let [hm, modifier] = str.replace(/\s+/g, '').split(/(am|pm|AM|PM)/i);
    modifier = modifier ? modifier.trim().toUpperCase() : '';
    let [h, m] = hm.split(':').map(Number);
    if (modifier === 'PM' && h !== 12) h += 12;
    if (modifier === 'AM' && h === 12) h = 0;
    return h * 60 + (m || 0);
  }
  function slotRange(slotString) {
    let [start, end] = slotString.split('-').map(t => t.trim());
    return [normalizeSlotTime(start), normalizeSlotTime(end)];
  }
  const getScheduleForSlot = (dayGroupDays, timeIndex, section) => {
    const normalizedDays = dayGroupDays.map(d => d.trim().toLowerCase());
    const [slotStartMin, slotEndMin] = slotRange(timeSlots[timeIndex]);
    const matchingSchedule = scheduleData.find(sched => {
      if (sched.section !== section) return false;
      let schedDays = sched.day.toLowerCase().replace(/\s+/g, '').split('/');
      if (!schedDays.some(d => normalizedDays.includes(d))) return false;
      let [schedStartStr, schedEndStr] = sched.time.split('-').map(t => t.trim());
      let schedStartMin = normalizeSlotTime(schedStartStr);
      let schedEndMin = normalizeSlotTime(schedEndStr);
      return slotStartMin >= schedStartMin && slotEndMin <= schedEndMin;
    });
    if (!matchingSchedule) return null;
    let [schedStartStr, schedEndStr] = matchingSchedule.time.split('-').map(t => t.trim());
    let schedStartMin = normalizeSlotTime(schedStartStr);
    let schedEndMin = normalizeSlotTime(schedEndStr);
    let span = 0;
    for (let i = timeIndex; i < timeSlots.length; i++) {
      let [startMin, endMin] = slotRange(timeSlots[i]);
      if (startMin >= schedStartMin && endMin <= schedEndMin) {
        span += 1;
      } else {
        break;
      }
    }
    return { schedule: matchingSchedule, span, startIndex: timeIndex };
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
                    <h2>
                      {course.toUpperCase()} - {formatYearDisplay(year)} Schedule
                    </h2>
                    <p>{courseDetails[course]?.name || 'Course Information'}</p>
                  </div>
                </div>

                <div className="schedule-actions">
                  <button className="schedule-btn btn-add" onClick={addNewClass} disabled={addingClass}>
                    <FontAwesomeIcon icon={faPlus} /> Add Class
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
                      onChange={e => filterByDay(e.target.value)}
                    >
                      <option value="all">All Days</option>
                      <option value="mth">Monday/Thursday</option>
                      <option value="w">Wednesday</option>
                      <option value="tf">Tuesday/Friday</option>
                    </select>
                  </div>
                </div>
              </div>
              {(loadingSchedules || loadingInstructors || loadingRooms) && (
                <p className="info-message">Loading data, please wait...</p>
              )}
              <div className="schedule-table-container">
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
              <td className="day-column">{dayGroup.label}</td>
              <td className="time-column">{time}</td>
              {sections.map(section => {
                const toMinutes = t => {
                  if (!t) return -1;
                  let [hms, ampm] = t.trim().split(/ (AM|PM|am|pm)$/i);
                  ampm = ampm || (t.match(/AM|PM/i) ? t.match(/AM|PM/i)[0] : '');
                  let [h, m] = hms.split(':').map(Number);
                  if (ampm.toLowerCase() === 'pm' && h !== 12) h += 12;
                  if (ampm.toLowerCase() === 'am' && h === 12) h = 0;
                  return h * 60 + (m || 0);
                };
                const slotBoundaries = s => {
                  let [start, end] = s.split('-').map(x => x.trim());
                  return [toMinutes(start), toMinutes(end)];
                };
                const [slotStart, slotEnd] = slotBoundaries(time);

                // For this day group, only consider schedules assigned to this group
                // Parse input days and slot days: all normalized lowercase, no spaces
                const slotGroupDays = dayGroup.days.map(d => d.toLowerCase().replace(/\s/g, ''));
                
                // Find schedule for this section that matches this day group and starts at this slot
                const schedule = scheduleData.find(sched => {
                  if (sched.section !== section) return false;
                  let schedDayStrs = sched.day.toLowerCase().replace(/\s/g, '').split('/');
                  // Schedule only matches if
                  //   - *Every* slotGroupDays entry is in schedDayStrs, and
                  //   - *Every* schedDayStrs entry is in slotGroupDays
                  // This strict check assures "Monday/Thursday" does NOT appear in "Tuesday/Friday"
                  const groupMatch =
                    slotGroupDays.length === schedDayStrs.length &&
                    slotGroupDays.every(d => schedDayStrs.includes(d)) &&
                    schedDayStrs.every(d => slotGroupDays.includes(d));
                  if (!groupMatch) return false;
                  // Time match
                  let [schedStart, schedEnd] = sched.time.split('-').map(str => str.trim());
                  let schedStartMin = toMinutes(schedStart);
                  let schedEndMin = toMinutes(schedEnd);
                  return schedStartMin === slotStart && schedEndMin > schedStartMin;
                });

                // If found, rowSpan calculation as before
                let rowSpan = 1;
                if (schedule) {
                  const [schedStartStr, schedEndStr] = schedule.time.split('-').map(str => str.trim());
                  const schedStartMin = toMinutes(schedStartStr);
                  const schedEndMin = toMinutes(schedEndStr);
                  rowSpan = 0;
                  for (let i = timeIndex; i < timeSlots.length; i++) {
                    const [boundStart, boundEnd] = slotBoundaries(timeSlots[i]);
                    if (boundStart >= schedStartMin && boundEnd <= schedEndMin) rowSpan++;
                    else break;
                  }
                }

                // Show schedule cell if this slot is the true start
                if (schedule) {
                  return (
                    <td
                      key={section}
                      rowSpan={rowSpan}
                      className="subject-cell"
                      onClick={() => {
                        if (deleteMode) {
                          setDeleteConfirm({ open: true, scheduleId: schedule._id });
                        }
                      }}
                      dangerouslySetInnerHTML={{
                        __html: `<div>
                          <strong>${schedule.subject}</strong><br/>
                          ${schedule.instructor}<br/>
                          <small>Room: ${schedule.room}</small>
                        </div>`,
                      }}
                    />
                  );
                }

                // If a spanning schedule covers this slot, do not render extra cell
                const isCovered = scheduleData.some(sched => {
                  if (sched.section !== section) return false;
                  let schedDayStrs = sched.day.toLowerCase().replace(/\s/g, '').split('/');
                  const groupMatch =
                    slotGroupDays.length === schedDayStrs.length &&
                    slotGroupDays.every(d => schedDayStrs.includes(d)) &&
                    schedDayStrs.every(d => slotGroupDays.includes(d));
                  if (!groupMatch) return false;
                  const [schedStart, schedEnd] = sched.time.split('-').map(str => str.trim());
                  const schedStartMin = toMinutes(schedStart);
                  const schedEndMin = toMinutes(schedEnd);
                  return slotStart > schedStartMin && slotEnd <= schedEndMin;
                });
                if (isCovered) return null;

                // Otherwise: blank cell
                return (
                  <td
                    key={section}
                    className={deleteMode ? 'delete-mode' : ''}
                    onClick={() => {
                      if (deleteMode) {
                        alert('No schedule to delete in this slot.');
                      }
                    }}
                  />
                );
              })}
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
                <FontAwesomeIcon icon={faPlus} style={{ color: '#059669' }} />
                Add New Class Section
              </h3>
              <button className="close-btn" onClick={() => setShowAddClassPopup(false)} disabled={addingClass}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form
              onSubmit={e => {
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
                <input name="section" type="text" placeholder="e.g., A, B, C" required disabled={addingClass} />
              </div>
              <div className="form-group">
                <label>Section Code *</label>
                <input name="sectionCode" type="text" placeholder="e.g., T111" required disabled={addingClass} />
              </div>
              <div className="form-group">
                <label>Subject Name *</label>
                <input name="subjectName" type="text" placeholder="e.g., Introduction to Computing" required disabled={addingClass} />
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
                  {instructors.map(instructor => (
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
                    rooms.map(room => (
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
                  {addingClass ? 'Adding...' : 'Add Class'}
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
              <button className="btn btn-cancel" onClick={() => setDeleteConfirm({ open: false, scheduleId: null })}>
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
