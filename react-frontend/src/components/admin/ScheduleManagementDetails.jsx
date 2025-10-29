import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faPlus,
  faTrash,
  faCalendarAlt,
  faGraduationCap,
  faCode,
  faTimes,
  faCheckCircle,
  faExclamationCircle,
  faClock,
  faUser,
  faDoorOpen
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';

// ============== SCHEDULE VALIDATION UTILITIES ==============
const parseTime = (timeStr) => {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  
  let [, hours, minutes, period] = match;
  hours = parseInt(hours);
  minutes = parseInt(minutes);
  
  if (period.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
};

const doTimesOverlap = (start1, end1, start2, end2) => {
  const s1 = parseTime(start1);
  const e1 = parseTime(end1);
  const s2 = parseTime(start2);
  const e2 = parseTime(end2);
  
  if (s1 === null || e1 === null || s2 === null || e2 === null) {
    return false;
  }
  
  return s1 < e2 && s2 < e1;
};

const doDaysOverlap = (day1, day2) => {
  const normalize = (day) => day.trim().toLowerCase();
  const d1 = normalize(day1);
  const d2 = normalize(day2);
  
  if (d1 === d2) return true;
  
  const days1 = d1.includes('/') ? d1.split('/') : [d1];
  const days2 = d2.includes('/') ? d2.split('/') : [d2];
  
  return days1.some(day => days2.includes(day));
};

// ============== INSTRUCTOR SESSION VALIDATION ==============
const categorizeTimeOfDay = (timeStr) => {
  const time = parseTime(timeStr);
  if (time === null) return null;
  const lunchStart = 12 * 60; // 12:00 PM
  const lunchEnd = 13 * 60;   // 1:00 PM
  if (time < lunchStart) return 'morning';
  if (time >= lunchEnd) return 'afternoon';
  return 'lunch';
};

const checkInstructorSessionLimit = (newSchedule, existingSchedules, instructorName) => {
  const [newStart, newEnd] = newSchedule.time.split(' - ').map(t => t.trim());
  const newStartMin = parseTime(newStart);
  const newEndMin = parseTime(newEnd);
  const lunchStart = 12 * 60; // 12:00 PM
  const lunchEnd = 13 * 60;   // 1:00 PM

  // Enforce 1-hour lunch break (no overlap with 12:00–1:00)
  if (newStartMin < lunchEnd && newEndMin > lunchStart) {
    return { valid: false, message: 'Schedule conflicts with mandatory lunch break (12:00 PM - 1:00 PM)' };
  }

  // Gather instructor's sessions for the same day
  const sameDaySessions = existingSchedules.filter(sched =>
    sched.instructor === instructorName && doDaysOverlap(newSchedule.day, sched.day)
  );

  // Compute period counts (by start time)
  const countByPeriod = (sessions) => sessions.reduce((acc, sched) => {
    const [s] = sched.time.split(' - ').map(t => t.trim());
    const p = categorizeTimeOfDay(s);
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  const currentCounts = countByPeriod(sameDaySessions);
  const newPeriod = categorizeTimeOfDay(newStart);

  // Max subjects per period: morning 2, afternoon-evening 3
  if (newPeriod === 'morning' && (currentCounts.morning || 0) >= 2) {
    return { valid: false, message: `${instructorName} already has 2 classes in the morning on ${newSchedule.day}.` };
  }
  if (newPeriod === 'afternoon' && (currentCounts.afternoon || 0) >= 3) {
    return { valid: false, message: `${instructorName} already has 3 classes in the afternoon/evening on ${newSchedule.day}.` };
  }

  // Build list including the new session
  const allSessions = [...sameDaySessions, { time: newSchedule.time }]
    .map(s => {
      const [sStart, sEnd] = s.time.split(' - ').map(t => t.trim());
      return { startMin: parseTime(sStart), endMin: parseTime(sEnd), period: categorizeTimeOfDay(sStart) };
    })
    .filter(s => s.startMin != null && s.endMin != null)
    .sort((a, b) => a.startMin - b.startMin);

  // Limit total classes per day to 5 (2 morning + 3 afternoon)
  if (allSessions.length > 5) {
    return { valid: false, message: `${instructorName} has reached the daily limit of 5 classes for ${newSchedule.day}.` };
  }

  // Enforce max 2 consecutive classes per period (back-to-back within the same period)
  const checkConsecutive = (period) => {
    let run = 1; let lastEnd = null;
    for (const s of allSessions.filter(x => x.period === period)) {
      if (lastEnd === null) { lastEnd = s.endMin; continue; }
      if (s.startMin === lastEnd) {
        run += 1;
        if (run > 2) return false;
      } else {
        run = 1;
      }
      lastEnd = s.endMin;
    }
    return true;
  };
  if (!checkConsecutive('morning')) {
    return { valid: false, message: `${instructorName} cannot have more than 2 consecutive morning classes on ${newSchedule.day}.` };
  }
  if (!checkConsecutive('afternoon')) {
    return { valid: false, message: `${instructorName} cannot have more than 2 consecutive afternoon classes on ${newSchedule.day}.` };
  }

  // Enforce "free time" after 4 classes: require 60 minutes free after the 4th before a 5th can start
  const prevSessions = sameDaySessions
    .map(s => {
      const [sStart, sEnd] = s.time.split(' - ').map(t => t.trim());
      return { startMin: parseTime(sStart), endMin: parseTime(sEnd) };
    })
    .filter(s => s.startMin != null && s.endMin != null)
    .sort((a, b) => a.startMin - b.startMin);

  if (prevSessions.length >= 4) {
    const lastPrevEnd = Math.max(...prevSessions.map(s => s.endMin));
    if (newStartMin < lastPrevEnd + 60) {
      return { valid: false, message: `${instructorName} must have a 1-hour free time after the 4th class before scheduling another class on ${newSchedule.day}.` };
    }
  }

  return { valid: true };
};
// ============== END INSTRUCTOR SESSION VALIDATION ==============

const checkScheduleConflicts = (newSchedule, existingSchedules) => {
  const conflicts = {
    instructor: [],
    room: [],
    section: []
  };
  
  const [newStart, newEnd] = newSchedule.time.split(' - ').map(t => t.trim());
  
  existingSchedules.forEach(schedule => {
    if (!doDaysOverlap(newSchedule.day, schedule.day)) {
      return;
    }
    
    const [schedStart, schedEnd] = schedule.time.split(' - ').map(t => t.trim());
    
    if (!doTimesOverlap(newStart, newEnd, schedStart, schedEnd)) {
      return;
    }
    
    if (newSchedule.instructor === schedule.instructor) {
      conflicts.instructor.push({
        subject: schedule.subject,
        section: `${schedule.course?.toUpperCase()}-${schedule.year?.charAt(0).toUpperCase()}${schedule.section}`,
        day: schedule.day,
        time: schedule.time
      });
    }
    
    if (newSchedule.room === schedule.room) {
      conflicts.room.push({
        subject: schedule.subject,
        section: `${schedule.course?.toUpperCase()}-${schedule.year?.charAt(0).toUpperCase()}${schedule.section}`,
        instructor: schedule.instructor,
        day: schedule.day,
        time: schedule.time
      });
    }
    
    if (newSchedule.section === schedule.section && 
        newSchedule.course === schedule.course && 
        newSchedule.year === schedule.year) {
      conflicts.section.push({
        subject: schedule.subject,
        instructor: schedule.instructor,
        room: schedule.room,
        day: schedule.day,
        time: schedule.time
      });
    }
  });
  
  return conflicts;
};
// ============== END VALIDATION UTILITIES ==============

const ScheduleManagementDetails = () => {
  const { course, year } = useParams();
  const navigate = useNavigate();

  const formatYearParam = (yearParam) => {
    return yearParam.replace(/(\d+)(st|nd|rd|th)?year/i, '$1st year').toLowerCase();
  };

  const normalizedYear = formatYearParam(year);

  const [sections, setSections] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showAddSchedulePopup, setShowAddSchedulePopup] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingSchedule, setAddingSchedule] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, scheduleId: null });
  const [conflictDetails, setConflictDetails] = useState(null);

  const courseDetails = {
    bsit: {
      name: 'Bachelor of Science in Information Technology',
      shortName: 'BSIT',
      icon: faGraduationCap,
      gradient: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
    },
    'bsemc-dat': {
      name: 'Bachelor of Science in Entertainment and Multimedia Computing',
      shortName: 'BSEMC-DAT',
      icon: faCode,
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    }
  };

  const formatYearDisplay = (yearParam) => {
    return yearParam.replace(/(\d+)/, '$1 ').replace(/([a-z])([A-Z])/g, '$1 $2');
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const autoRefreshInterval = setInterval(fetchData, 30000);

    return () => {
      clearInterval(autoRefreshInterval);
    };
  }, [course, normalizedYear]);

  useEffect(() => {
    if (sections.length > 0 && !selectedSection) {
      setSelectedSection(sections[0]);
    }
  }, [sections, selectedSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sectionsRes, schedulesRes, instructorsRes, roomsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/sections?course=${course}&year=${normalizedYear}`),
        axios.get(`http://localhost:5000/api/schedule?course=${course}&year=${normalizedYear}`),
        axios.get('http://localhost:5000/api/instructors'), // ✅ This endpoint needs to return active instructors
        axios.get('http://localhost:5000/api/admin/rooms')
      ]);
  
      console.log('Sections fetched:', sectionsRes.data);
      console.log('Schedules fetched:', schedulesRes.data);
      console.log('Instructors fetched:', instructorsRes.data); // ✅ Check what you're getting
  
      const sortedSections = (Array.isArray(sectionsRes.data) ? sectionsRes.data : []).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setSections(sortedSections);
      setSchedules(Array.isArray(schedulesRes.data) ? schedulesRes.data : []);
      
      // ✅ FIX: Handle instructor data properly
      if (Array.isArray(instructorsRes.data)) {
        // Direct array of instructors
        const activeInstructors = instructorsRes.data
          .filter(inst => inst.status === 'active')
          .map(inst => ({
            id: inst.instructorId || inst._id,
            name: `${inst.firstname} ${inst.lastname}`,
            email: inst.email
          }));
        setInstructors(activeInstructors);
      } else if (instructorsRes.data.instructors && Array.isArray(instructorsRes.data.instructors)) {
        // Wrapped in an object
        const activeInstructors = instructorsRes.data.instructors
          .filter(inst => inst.status === 'active')
          .map(inst => ({
            id: inst.instructorId || inst._id,
            name: `${inst.firstname} ${inst.lastname}`,
            email: inst.email
          }));
        setInstructors(activeInstructors);
      } else {
        setInstructors([]);
      }
      
      // Handle rooms
      if (Array.isArray(roomsRes.data)) {
        setRooms(roomsRes.data);
      } else if (roomsRes.data.rooms && Array.isArray(roomsRes.data.rooms)) {
        setRooms(roomsRes.data.rooms);
      } else {
        setRooms([]);
      }
  
      console.log('✅ Instructors processed:', instructors.length); // Debug log
      console.log('✅ Rooms processed:', rooms.length); // Debug log
    } catch (error) {
      showNotification('error', 'Error fetching data.');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
  };

  const getSectionSchedules = (sectionName) => {
    return schedules.filter(sched => sched.section === sectionName);
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    setAddingSchedule(true);

    const formData = new FormData(e.target);
    const instructorName = formData.get('instructor');
    
    // Find instructor email from the instructor name
    const selectedInstructor = instructors.find(inst => inst.name === instructorName);
    const instructorEmail = selectedInstructor ? selectedInstructor.email : '';
    
    console.log('🔍 Creating schedule for instructor:', instructorName);
    console.log('🔍 Instructor email:', instructorEmail);
    
    const scheduleData = {
      course,
      year: normalizedYear,
      section: selectedSection.name,
      subject: formData.get('subject'),
      day: formData.get('day'),
      time: `${formData.get('startTime')} - ${formData.get('endTime')}`,
      instructor: instructorName,
      room: formData.get('room')
    };
    
    // Only add instructorEmail if we found it
    if (instructorEmail) {
      scheduleData.instructorEmail = instructorEmail;
    }

    // ✅ Check instructor session limits FIRST
    const sessionCheck = checkInstructorSessionLimit(
      scheduleData, 
      schedules, 
      instructorName
    );
    
    if (!sessionCheck.valid) {
      showNotification('error', sessionCheck.message);
      setAddingSchedule(false);
      return;
    }

    // Check for conflicts
    const conflicts = checkScheduleConflicts(scheduleData, schedules);
    const hasConflicts = conflicts.instructor.length > 0 || 
                        conflicts.room.length > 0 || 
                        conflicts.section.length > 0;

    if (hasConflicts) {
      setConflictDetails(conflicts);
      setAddingSchedule(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/schedule/create', scheduleData);
      if (res.data.success) {
        showNotification('success', 'Schedule added successfully!');
        setShowAddSchedulePopup(false);
        await fetchData();
        e.target.reset();
      } else {
        showNotification('error', res.data.message || 'Failed to add schedule.');
      }
    } catch (error) {
      showNotification('error', 'Error adding schedule.');
      console.error('Error adding schedule:', error);
    } finally {
      setAddingSchedule(false);
    }
  };

  const handleDeleteSchedule = async () => {
    try {
      const res = await axios.delete(`http://localhost:5000/api/schedule/${deleteConfirm.scheduleId}`);
      if (res.data.success) {
        showNotification('success', 'Schedule deleted successfully.');
        await fetchData();
      } else {
        showNotification('error', res.data.message || 'Failed to delete schedule.');
      }
    } catch (error) {
      showNotification('error', 'Error deleting schedule.');
      console.error('Error deleting schedule:', error);
    }
    setDeleteConfirm({ open: false, scheduleId: null });
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        <Header title="Schedule Management" />
        <div className="dashboard-content">
          {/* Back Button */}
          <button
            onClick={() => navigate('/admin/schedule-management')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              color: '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '20px',
              fontSize: '15px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Year Levels</span>
          </button>

          {/* Course Header */}
          <div className="welcome-section" style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <FontAwesomeIcon 
                icon={courseDetails[course]?.icon || faGraduationCap} 
                style={{ fontSize: 32, color: '#f97316' }}
              />
              <h2 style={{ margin: 0 }}>
                {courseDetails[course]?.shortName} - {formatYearDisplay(year)}
              </h2>
            </div>
            <p style={{ margin: 0 }}>{courseDetails[course]?.name}</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading sections and schedules...
            </div>
          ) : sections.length === 0 ? (
            <div style={{
              background: '#fff',
              padding: '60px 30px',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              textAlign: 'center',
              borderLeft: '5px solid #f97316',
            }}>
              <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '16px' }}>
                No sections found for {courseDetails[course]?.shortName} {formatYearDisplay(year)}.
              </p>
              <button
                onClick={() => navigate('/admin/manage-schedule')}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '15px',
                }}
              >
                Go to Section Management
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
              {/* Sections Sidebar */}
              <div
                style={{
                  background: '#fff',
                  padding: '24px',
                  borderRadius: '18px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  borderLeft: '5px solid #f97316',
                  height: 'fit-content',
                  maxHeight: 'calc(100vh - 280px)',
                  overflowY: 'auto',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #f1f5f9',
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                    Sections
                  </h3>
                  <span style={{
                    background: '#e0e7ff',
                    color: '#4f46e5',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '700',
                  }}>
                    {sections.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {sections.map((section) => (
                    <button
                      key={section._id}
                      onClick={() => setSelectedSection(section)}
                      style={{
                        background: selectedSection?._id === section._id ? '#eff6ff' : '#f9fafb',
                        border: selectedSection?._id === section._id ? '2px solid #3b82f6' : '2px solid transparent',
                        padding: '16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        width: '100%',
                      }}
                      onMouseOver={(e) => {
                        if (selectedSection?._id !== section._id) {
                          e.currentTarget.style.background = '#f3f4f6';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (selectedSection?._id !== section._id) {
                          e.currentTarget.style.background = '#f9fafb';
                        }
                      }}
                    >
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        {course.toUpperCase()}-{year.charAt(0).toUpperCase()}{section.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {getSectionSchedules(section.name).length} schedule(s)
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedules Content */}
              <div
                style={{
                  background: '#fff',
                  padding: '30px',
                  borderRadius: '18px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  borderLeft: '5px solid #f97316',
                  height: 'fit-content',
                  maxHeight: 'calc(100vh - 280px)',
                  overflowY: 'auto',
                }}
              >
                {selectedSection && (
                  <>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '24px',
                      paddingBottom: '20px',
                      borderBottom: '2px solid #f1f5f9',
                    }}>
                      <div>
                        <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
                          {course.toUpperCase()}-{year.charAt(0).toUpperCase()}{selectedSection.name}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                          {getSectionSchedules(selectedSection.name).length} schedule(s)
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAddSchedulePopup(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 20px',
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '15px',
                          transition: 'transform 0.18s ease',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseOut={(e) => (e.currentTarget.style.transform = '')}
                      >
                        <FontAwesomeIcon icon={faPlus} />
                        Add Schedule
                      </button>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '20px',
                    }}>
                      {getSectionSchedules(selectedSection.name).length === 0 ? (
                        <div style={{
                          gridColumn: '1 / -1',
                          textAlign: 'center',
                          padding: '60px 20px',
                        }}>
                          <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: 64, color: '#d1d5db', marginBottom: '16px' }} />
                          <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '20px' }}>No schedules yet for this section</p>
                          <button
                            onClick={() => setShowAddSchedulePopup(true)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '12px 24px',
                              background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            <FontAwesomeIcon icon={faPlus} />
                            Add First Schedule
                          </button>
                        </div>
                      ) : (
                        getSectionSchedules(selectedSection.name).map((schedule) => (
                          <div
                            key={schedule._id}
                            style={{
                              background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
                              border: '2px solid #e5e7eb',
                              borderRadius: '14px',
                              padding: '20px',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = '#3b82f6';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              marginBottom: '16px',
                              paddingBottom: '16px',
                              borderBottom: '1px solid #e5e7eb',
                            }}>
                              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0, flex: 1 }}>
                                {schedule.subject}
                              </h4>
                              <button
                                onClick={() => setDeleteConfirm({ open: true, scheduleId: schedule._id })}
                                style={{
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  border: 'none',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.background = '#fecaca')}
                                onMouseOut={(e) => (e.currentTarget.style.background = '#fee2e2')}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#374151' }}>
                                <FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#6b7280', width: '16px' }} />
                                <span>{schedule.day}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#374151' }}>
                                <FontAwesomeIcon icon={faClock} style={{ color: '#6b7280', width: '16px' }} />
                                <span>{schedule.time}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#374151' }}>
                                <FontAwesomeIcon icon={faUser} style={{ color: '#6b7280', width: '16px' }} />
                                <span>{schedule.instructor}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#374151' }}>
                                <FontAwesomeIcon icon={faDoorOpen} style={{ color: '#6b7280', width: '16px' }} />
                                <span>{schedule.room}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Notification */}
          {notification.show && (
            <div
              style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '16px 20px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontWeight: '600',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
                zIndex: 10000,
                background: notification.type === 'success' ? '#d1fae5' : '#fee2e2',
                color: notification.type === 'success' ? '#065f46' : '#991b1b',
                animation: 'slideIn 0.3s ease',
              }}
            >
              <FontAwesomeIcon
                icon={notification.type === 'success' ? faCheckCircle : faExclamationCircle}
              />
              <span>{notification.message}</span>
            </div>
          )}

          {/* Add Schedule Popup */}
          {showAddSchedulePopup && (
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
              zIndex: 9999,
            }}>
              <div style={{
                background: 'white',
                borderRadius: '18px',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '24px',
                  borderBottom: '2px solid #f3f4f6',
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#1f2937',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <FontAwesomeIcon icon={faPlus} style={{ color: '#059669' }} />
                    Add Schedule
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddSchedulePopup(false);
                      setConflictDetails(null);
                    }}
                    disabled={addingSchedule}
                    style={{
                      background: '#f3f4f6',
                      border: 'none',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                {/* Conflict Warning */}
                {conflictDetails && (
                  <div style={{
                    margin: '20px 24px',
                    padding: '16px',
                    background: '#fef2f2',
                    border: '2px solid #fecaca',
                    borderRadius: '10px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '12px',
                      color: '#991b1b',
                      fontWeight: '700',
                      fontSize: '15px',
                    }}>
                      <FontAwesomeIcon icon={faExclamationCircle} />
                      <span>Schedule Conflict Detected!</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#7f1d1d' }}>
                      {conflictDetails.instructor.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Instructor Conflict:</strong> {conflictDetails.instructor[0].instructor} is already teaching "{conflictDetails.instructor[0].subject}" ({conflictDetails.instructor[0].section}) on {conflictDetails.instructor[0].day} at {conflictDetails.instructor[0].time}
                        </div>
                      )}
                      {conflictDetails.room.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Room Conflict:</strong> Room {conflictDetails.room[0].room} is already booked for "{conflictDetails.room[0].subject}" ({conflictDetails.room[0].section}) on {conflictDetails.room[0].day} at {conflictDetails.room[0].time}
                        </div>
                      )}
                      {conflictDetails.section.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong>Section Conflict:</strong> This section already has "{conflictDetails.section[0].subject}" scheduled on {conflictDetails.section[0].day} at {conflictDetails.section[0].time}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setConflictDetails(null)}
                      style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Modify Schedule
                    </button>
                  </div>
                )}

                <form onSubmit={handleAddSchedule} style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Subject Name *
                    </label>
                    <input
                      name="subject"
                      type="text"
                      placeholder="e.g., Data Structures and Algorithms"
                      required
                      disabled={addingSchedule}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  {/* ✅ UPDATED: Individual Day Selection */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Day *
                    </label>
                    <select
                      name="day"
                      required
                      disabled={addingSchedule}
                      onChange={() => setConflictDetails(null)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px',
                      }}
                    >
                      <option value="">Select Day</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                        Start Time *
                      </label>
                      <input
                        name="startTime"
                        type="text"
                        placeholder="e.g., 9:00 AM"
                        pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$"
                        title="Enter time in HH:MM AM/PM format"
                        required
                        disabled={addingSchedule}
                        onChange={() => setConflictDetails(null)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                        End Time *
                      </label>
                      <input
                        name="endTime"
                        type="text"
                        placeholder="e.g., 10:30 AM"
                        pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM|am|pm)$"
                        title="Enter time in HH:MM AM/PM format"
                        required
                        disabled={addingSchedule}
                        onChange={() => setConflictDetails(null)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Instructor *
                    </label>
                    <select
                      name="instructor"
                      required
                      disabled={addingSchedule}
                      onChange={() => setConflictDetails(null)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px',
                      }}
                    >
                      <option value="">Select Instructor</option>
                      {instructors.map((instructor) => (
                        <option key={instructor.id} value={instructor.name}>
                          {instructor.name} ({instructor.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Room *
                    </label>
                    <select
                      name="room"
                      required
                      disabled={addingSchedule}
                      onChange={() => setConflictDetails(null)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px',
                      }}
                    >
                      <option value="">Select Room</option>
                      {rooms.map((room) => (
                        <option key={room._id} value={room.room}>
                          {room.room}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddSchedulePopup(false);
                        setConflictDetails(null);
                      }}
                      disabled={addingSchedule}
                      style={{
                        padding: '12px 24px',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingSchedule}
                      style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      {addingSchedule ? 'Adding...' : 'Add Schedule'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirm.open && (
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
              zIndex: 9999,
            }}>
              <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '18px',
                textAlign: 'center',
                maxWidth: '400px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
              }}>
                <p style={{ fontSize: '16px', color: '#374151', marginBottom: '24px' }}>
                  Are you sure you want to delete this schedule?
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={handleDeleteSchedule}
                    style={{
                      padding: '12px 24px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ open: false, scheduleId: null })}
                    style={{
                      padding: '12px 24px',
                      background: '#e5e7eb',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ScheduleManagementDetails;
