import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faDownload,
  faFilter,
  faGraduationCap,
  faCode,
  faTimes,
  faCheckCircle,
  faExclamationCircle,
  faMinusCircle,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import { generateTimeSlots, TIME_SLOT_CONFIGS } from '../../utils/timeUtils.js';

const ScheduleCalendar = () => {
  const { course, year } = useParams();
  const navigate = useNavigate();

  const formatYearParam = (yearParam) => {
    return yearParam.replace(/(\d+)(st|nd|rd|th)?year/i, '$1st year').toLowerCase();
  };

  const normalizedYear = formatYearParam(year);

  const [selectedSection, setSelectedSection] = useState(null);
  const [removeSectionMode, setRemoveSectionMode] = useState(false);
  const [dayFilter, setDayFilter] = useState('all');
  const [scheduleData, setScheduleData] = useState([]);
  const [showAddSectionPopup, setShowAddSectionPopup] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [removeSectionConfirm, setRemoveSectionConfirm] = useState({ open: false, sectionId: null, sectionName: '' });
  const [sections, setSections] = useState([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [sectionErrorMessage, setSectionErrorMessage] = useState('');

  const timeSlots = generateTimeSlots(
    TIME_SLOT_CONFIGS.DETAILED.startHour,
    TIME_SLOT_CONFIGS.DETAILED.endHour,
    TIME_SLOT_CONFIGS.DETAILED.duration
  );

  const dayDisplayGroups = [
    { label: 'Monday', day: 'monday', group: 'mon' },
    { label: 'Tuesday', day: 'tuesday', group: 'tue' },
    { label: 'Wednesday', day: 'wednesday', group: 'wed' },
    { label: 'Thursday', day: 'thursday', group: 'thu' },
    { label: 'Friday', day: 'friday', group: 'fri' },
    { label: 'Saturday', day: 'saturday', group: 'sat' }
  ];

  const courseDetails = {
    bsit: {
      name: 'Bachelor of Science in Information Technology',
      gradient: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      icon: faGraduationCap
    },
    'bsemc-dat': {
      name: 'Bachelor of Science in Entertainment and Multimedia Computing - Digital Animation Technology',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
      icon: faCode
    }
  };

  const fetchAllData = useCallback(async () => {
    setLoadingSchedules(true);
    try {
      const [sectionsRes, schedulesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/sections?course=${course}&year=${normalizedYear}`, {
          headers: { 'Cache-Control': 'no-cache' }
        }),
        axios.get(`http://localhost:5000/api/schedule?course=${course}&year=${normalizedYear}`, {
          headers: { 'Cache-Control': 'no-cache' }
        })
      ]);

      const sortedSections = (Array.isArray(sectionsRes.data) ? sectionsRes.data : []).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setSections(sortedSections);
      setScheduleData(Array.isArray(schedulesRes.data) ? schedulesRes.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('error', 'Error fetching data.');
    } finally {
      setLoadingSchedules(false);
    }
  }, [course, normalizedYear]);

  useEffect(() => {
    fetchAllData();

    // Auto-refresh every 30 seconds
    const autoRefreshInterval = setInterval(fetchAllData, 30000);

    return () => {
      clearInterval(autoRefreshInterval);
    };
  }, [fetchAllData]);

  useEffect(() => {
    if (sections.length > 0 && !selectedSection) {
      setSelectedSection(sections[0]);
    }
  }, [sections, selectedSection]);

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

  const toggleRemoveSectionMode = () => {
    setRemoveSectionMode(!removeSectionMode);
  };

  const downloadSchedule = () => alert('Download functionality would export the schedule as PDF or Excel');

  const timeStringToMinutes = (timeStr) => {
    if (!timeStr) return -1;
    
    const cleanTime = timeStr.trim().split(' - ')[0];
    let [time, modifier] = cleanTime.split(' ');
    if (!modifier) return -1;
    
    let [h, m] = time.split(':').map(Number);
    if (modifier.toLowerCase() === 'pm' && h !== 12) h += 12;
    if (modifier.toLowerCase() === 'am' && h === 12) h = 0;
    return h * 60 + (m || 0);
  };

  const confirmRemoveSection = async () => {
    try {
      setRemoveSectionConfirm({ open: false, sectionId: null, sectionName: '' });
      
      const response = await axios.delete(`http://localhost:5000/api/sections/${removeSectionConfirm.sectionId}`);
      
      if (response.data.success) {
        showNotification('success', 'Section removed successfully.');
        await fetchAllData();
        setSelectedSection(null);
      } else {
        showNotification('error', response.data.message || 'Failed to remove section.');
      }
    } catch (err) {
      showNotification('error', 'Error removing section.');
      console.error('Remove section error:', err.response?.data || err.message);
    }
  };

  const handleAddSectionSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = newSectionName.trim();
  
    if (!trimmedName) {
      setSectionErrorMessage('Section name cannot be empty.');
      return;
    }
  
    const sectionExists = sections.some(
      (section) => section.name.toLowerCase() === trimmedName.toLowerCase()
    );
  
    if (sectionExists) {
      setSectionErrorMessage("Can't add the same section.");
      return;
    }
  
    setSectionErrorMessage('');
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
        await fetchAllData();
      } else {
        showNotification('error', res.data.message || 'Failed to add section.');
      }
    } catch (error) {
      showNotification('error', 'Error adding section.');
      console.error(error);
    }
    setAddingSection(false);
  };

  const getSectionSchedules = (sectionName) => {
    return scheduleData.filter(sched => sched.section === sectionName);
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        <Header title="Section Management" />
        <div className="dashboard-content">
          {/* Back Button */}
          <button
            onClick={() => navigate('/admin/manage-schedule')}
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
            <span>Back to Courses</span>
          </button>

          {/* Course Header */}
          <div className="welcome-section" style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <FontAwesomeIcon 
                icon={courseDetails[course]?.icon || faGraduationCap} 
                style={{ fontSize: 32, color: '#f97316' }}
              />
              <h2 style={{ margin: 0 }}>
                {course.toUpperCase()} - {formatYearDisplay(year)} Schedule
              </h2>
            </div>
            <p style={{ margin: 0 }}>{courseDetails[course]?.name || 'Course Information'}</p>
          </div>

          {loadingSchedules ? (
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
                No sections found for {course.toUpperCase()} {formatYearDisplay(year)}.
              </p>
              <button
                onClick={() => setShowAddSectionPopup(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FontAwesomeIcon icon={faPlus} />
                Add First Section
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => setShowAddSectionPopup(true)}
                    style={{
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Add Section
                  </button>

                  <button
                    onClick={toggleRemoveSectionMode}
                    style={{
                      padding: '12px 16px',
                      background: removeSectionMode 
                        ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                        : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <FontAwesomeIcon icon={removeSectionMode ? faTimes : faMinusCircle} />
                    {removeSectionMode ? 'Cancel' : 'Remove Section'}
                  </button>
                </div>
              </div>

              {/* Schedule Table */}
              <div
                style={{
                  background: '#fff',
                  padding: '30px',
                  borderRadius: '18px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  borderLeft: '5px solid #f97316',
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
                          {course.toUpperCase()}-{year.charAt(0).toUpperCase()}{selectedSection.name} Schedule
                        </h3>
                        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                          View and manage class schedules
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {removeSectionMode && (
                          <button
                            onClick={() => setRemoveSectionConfirm({ 
                              open: true, 
                              sectionId: selectedSection._id, 
                              sectionName: selectedSection.name 
                            })}
                            style={{
                              padding: '12px 20px',
                              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              fontSize: '15px',
                            }}
                          >
                            <FontAwesomeIcon icon={faMinusCircle} style={{ marginRight: '8px' }} />
                            Remove This Section
                          </button>
                        )}
                        <button
                          onClick={downloadSchedule}
                          style={{
                            padding: '12px 20px',
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '15px',
                          }}
                        >
                          <FontAwesomeIcon icon={faDownload} style={{ marginRight: '8px' }} />
                          Download
                        </button>
                      </div>
                    </div>

                    {/* Filter */}
                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FontAwesomeIcon icon={faFilter} style={{ color: '#6b7280' }} />
                      <select
                        value={dayFilter}
                        onChange={(e) => filterByDay(e.target.value)}
                        style={{
                          padding: '10px 12px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: '500',
                        }}
                      >
                        <option value="all">All Days</option>
                        <option value="mon">Monday</option>
                        <option value="tue">Tuesday</option>
                        <option value="wed">Wednesday</option>
                        <option value="thu">Thursday</option>
                        <option value="fri">Friday</option>
                        <option value="sat">Saturday</option>
                      </select>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)', color: 'white' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', fontSize: '13px' }}>Day</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', fontSize: '13px' }}>Time</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', fontSize: '13px' }}>Subject</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', fontSize: '13px' }}>Instructor</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', fontSize: '13px' }}>Room</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayDisplayGroups
                            .filter(dayGroup => dayFilter === 'all' || dayFilter === dayGroup.group)
                            .map(dayGroup =>
                              timeSlots.map((time, timeIndex) => {
                                const schedule = scheduleData.find(sched => {
                                  if (sched.section !== selectedSection.name) return false;

                                  const schedDayStrs = sched.day.toLowerCase().replace(/\s/g, '').split('/');
                                  const matchesDay = schedDayStrs.includes(dayGroup.day);
                                  if (!matchesDay) return false;

                                  const [schedStart, schedEnd] = sched.time.split(' - ').map(x => x.trim());
                                  const schedStartMin = timeStringToMinutes(schedStart);
                                  const schedEndMin = timeStringToMinutes(schedEnd);

                                  const [slotStart, slotEnd] = time.split(' - ').map(x => x.trim());
                                  const slotStartMin = timeStringToMinutes(slotStart);
                                  const slotEndMin = timeStringToMinutes(slotEnd);

                                  return schedStartMin <= slotStartMin && slotEndMin <= schedEndMin;
                                });

                                if (!schedule) return null;

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
                                
                                const isFirstSlot = (firstMatchingSlotIndex === timeIndex);
                                if (!isFirstSlot) return null;

                                return (
                                  <tr key={`${dayGroup.label}-${timeIndex}-${schedule._id}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '12px', color: '#374151', fontWeight: '500' }}>{dayGroup.label}</td>
                                    <td style={{ padding: '12px', color: '#374151' }}>{schedule.time}</td>
                                    <td style={{ padding: '12px', color: '#1e40af', fontWeight: '600' }}>{schedule.subject}</td>
                                    <td style={{ padding: '12px', color: '#374151' }}>{schedule.instructor}</td>
                                    <td style={{ padding: '12px', color: '#374151', fontStyle: 'italic' }}>{schedule.room}</td>
                                  </tr>
                                );
                              })
                            )}
                          {getSectionSchedules(selectedSection.name).length === 0 && (
                            <tr>
                              <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                No schedules for this section yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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
              }}
            >
              <FontAwesomeIcon
                icon={notification.type === 'success' ? faCheckCircle : faExclamationCircle}
              />
              <span>{notification.message}</span>
            </div>
          )}

          {/* Add Section Popup */}
          {showAddSectionPopup && (
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
                maxWidth: '400px',
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
                    Add New Section
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddSectionPopup(false);
                      setNewSectionName('');
                      setSectionErrorMessage('');
                    }}
                    disabled={addingSection}
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

                <form onSubmit={handleAddSectionSubmit} style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      Section Name *
                    </label>
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
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px',
                      }}
                    />
                    {sectionErrorMessage && (
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '10px', 
                        background: '#fdecea', 
                        color: '#a12722', 
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        <FontAwesomeIcon icon={faExclamationCircle} />
                        {sectionErrorMessage}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddSectionPopup(false);
                        setNewSectionName('');
                        setSectionErrorMessage('');
                      }}
                      disabled={addingSection}
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
                      disabled={addingSection}
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
                      {addingSection ? 'Adding...' : 'Add Section'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Remove Section Confirmation Modal */}
          {removeSectionConfirm.open && (
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
                <p style={{ fontSize: '16px', color: '#374151', marginBottom: '10px' }}>
                  Are you sure you want to remove section <strong>{removeSectionConfirm.sectionName}</strong>?
                </p>
                <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '24px' }}>
                  Warning: This will permanently delete the section and all schedules associated with it from the database.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={confirmRemoveSection}
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
                    Yes, Remove Section
                  </button>
                  <button
                    onClick={() => setRemoveSectionConfirm({ open: false, sectionId: null, sectionName: '' })}
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

export default ScheduleCalendar;
