import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGraduationCap, 
  faCode, 
  faPlus,
  faArchive,
  faTimes,
  faUsers,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import apiClient from '../../services/apiClient.js';
import { useToast } from '../common/ToastProvider.jsx';
import ConfirmationDialog from '../common/ConfirmationDialog.jsx';

const SectionManagement = () => {
  const { showToast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddSectionPopup, setShowAddSectionPopup] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [addingSection, setAddingSection] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ 
    show: false, 
    title: '', 
    message: '', 
    onConfirm: null, 
    destructive: false 
  });
  const [archivedSections, setArchivedSections] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [showArchivedModal, setShowArchivedModal] = useState(false);

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
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    }
  ];

  const yearLevels = useMemo(() => [
    { id: '1styear', label: '1st Year', year: 1 },
    { id: '2ndyear', label: '2nd Year', year: 2 },
    { id: '3rdyear', label: '3rd Year', year: 3 },
    { id: '4thyear', label: '4th Year', year: 4 }
  ], []);


  const fetchSections = useCallback(async () => {
    if (!selectedCourse || !selectedYear) {
      setSections([]);
      setError(null);
      setLoadingArchived(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const yearLevel = yearLevels.find(y => y.id === selectedYear);
      const yearValue = yearLevel ? String(yearLevel.year) : selectedYear;
      const response = await apiClient.get(`/api/sections?course=${selectedCourse}&year=${yearValue}`);
      if (Array.isArray(response.data)) {
        const sortedSections = response.data.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setSections(sortedSections);
      } else if (response.data.success === false) {
        setError(response.data.message || 'Error fetching sections');
        setSections([]);
      }
      setLoadingArchived(true);
      const archivedRes = await apiClient.get(`/api/sections/archived/list?course=${selectedCourse}&year=${yearValue}`);
      setArchivedSections(Array.isArray(archivedRes.data) ? archivedRes.data : []);
      setLoadingArchived(false);
    } catch (err) {
      setError('Error fetching sections');
      setSections([]);
      setArchivedSections([]);
      setLoadingArchived(false);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse, selectedYear, yearLevels]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) {
      showToast('Please enter a section name', 'error');
      return;
    }
    if (!selectedCourse || !selectedYear) {
      showToast('Please select a course and year level', 'error');
      return;
    }
    setAddingSection(true);
    try {
      const yearLevel = yearLevels.find(y => y.id === selectedYear);
      const yearValue = yearLevel ? String(yearLevel.year) : selectedYear;
      const response = await apiClient.post('/api/sections/create', {
        course: selectedCourse,
        year: yearValue,
        name: newSectionName.trim(),
      });
      if (response.data.success) {
        showToast('Section added successfully!', 'success');
        setNewSectionName('');
        setShowAddSectionPopup(false);
        await fetchSections();
      } else {
        showToast(response.data.message || 'Failed to add section', 'error');
      }
    } catch (err) {
      console.error('Error adding section:', err);
      showToast(err.response?.data?.message || 'Error adding section', 'error');
    } finally {
      setAddingSection(false);
    }
  };

  const handleDeleteSectionPermanent = (section) => {
    setConfirmDialog({
      show: true,
      title: 'Delete Section Permanently',
      message: `Are you sure you want to permanently delete section "${section.name}" and all its associated schedules? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/sections/${section._id}/permanent`);
          showToast('Section deleted permanently', 'success');
          fetchSections();
          setArchivedSections(archivedSections.filter(s => s._id !== section._id));
        } catch {
          showToast('Failed to delete section', 'error');
        }
      },
      destructive: true
    });
  };

  const handleRestoreSection = async (section) => {
      try {
        await apiClient.patch(`/api/sections/${section._id}/restore`);
      showToast('Section restored successfully', 'success');
      fetchSections();
      setArchivedSections(archivedSections.filter(s => s._id !== section._id));
    } catch {
      showToast('Failed to restore section', 'error');
    }
  };

  const handleOpenArchivedModal = () => {
    setShowArchivedModal(true);
    if (archivedSections.length === 0) {
      fetchArchivedSections();
    }
  };

  const closeArchivedModal = () => {
    setShowArchivedModal(false);
  };

  const fetchArchivedSections = async () => {
    setLoadingArchived(true);
    try {
      const yearLevel = yearLevels.find(y => y.id === selectedYear);
      const yearValue = yearLevel ? String(yearLevel.year) : selectedYear;
      const res = await apiClient.get(`/api/sections/archived/list?course=${selectedCourse}&year=${yearValue}`);
      setArchivedSections(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching archived sections', err);
      showToast('Error loading archived sections.', 'error');
      setArchivedSections([]);
    } finally {
      setLoadingArchived(false);
    }
  };

  const handleArchiveSection = (section) => {
    setConfirmDialog({
      show: true,
      title: 'Archive Section',
      message: `Are you sure you want to archive section "${section.name}"? You can restore it later from the archived list.`,
      onConfirm: async () => {
        try {
          await apiClient.patch(`/api/sections/${section._id}/archive`);
          showToast('Section archived successfully', 'success');
          fetchSections();
        } catch {
          showToast('Failed to archive section', 'error');
        }
      },
      destructive: false
    });
  };

  const currentCourse = courses.find(c => c.id === selectedCourse);

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main className="main-content" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        <Header title="Section Management" />
        <div className="dashboard-content" style={{ marginTop: '140px' }}>
          {/* Welcome Section */}
          <div className="welcome-section" style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <FontAwesomeIcon 
                icon={faUsers} 
                style={{ fontSize: 32, color: '#f97316' }}
              />
              <h2 style={{ margin: 0 }}>Section Management</h2>
            </div>
            <p style={{ margin: 0 }}>Select a course and year level to manage sections</p>
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
                  onClick={() => {
                    setSelectedCourse(course.id);
                    setSelectedYear(null);
                    setSections([]);
                  }}
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '16px' 
              }}>
                {yearLevels.map((year) => (
                  <button
                    key={year.id}
                    onClick={() => setSelectedYear(year.id)}
                    style={{
                      padding: '20px',
                      background: selectedYear === year.id ? currentCourse.gradient : '#f9fafb',
                      color: selectedYear === year.id ? 'white' : '#374151',
                      border: selectedYear === year.id ? 'none' : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '16px',
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                    }}
                    onMouseOver={(e) => {
                      if (selectedYear !== year.id) {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedYear !== year.id) {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {year.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sections List - Only shows when both course and year are selected */}
          {selectedCourse && selectedYear && (
            <div style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderLeft: '5px solid #f97316',
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                  Sections for {courses.find(c => c.id === selectedCourse)?.shortName} - {selectedYear}
                </h3>
                <button
                  onClick={() => setShowAddSectionPopup(true)}
                  style={{
                    padding: '10px 20px',
                    background: currentCourse.gradient,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Add Section
                </button>
                <button
                  onClick={handleOpenArchivedModal}
                  style={{
                    padding: '12px 20px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#e5e7eb';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                >
                  <FontAwesomeIcon icon={faArchive} />
                  Archived
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Loading sections...
                </div>
              ) : error ? (
                <div style={{ 
                  padding: '24px', 
                  background: '#fef2f2', 
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#dc2626'
                }}>
                  <FontAwesomeIcon icon={faExclamationCircle} />
                  <span>{error}</span>
                </div>
              ) : sections.length === 0 ? (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  color: '#64748b' 
                }}>
                  <FontAwesomeIcon 
                    icon={faUsers} 
                    style={{ fontSize: 48, marginBottom: '16px', opacity: 0.5 }}
                  />
                  <p style={{ margin: 0, fontSize: '16px' }}>
                    No sections found. Click "Add Section" to create one.
                  </p>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                  gap: '16px' 
                }}>
                  {sections.map((section) => (
                    <div
                      key={section._id}
                      style={{
                        padding: '20px',
                        background: '#f9fafb',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      <span style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: '#1e293b' 
                      }}>
                        {section.name}
                      </span>
                      <button
                        onClick={() => handleArchiveSection(section)}
                        style={{
                          padding: '8px 12px',
                          background: '#fef3c7',
                          color: '#b45309',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = '#fde68a';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = '#fef3c7';
                        }}
                      >
                        <FontAwesomeIcon icon={faArchive} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Instructions when no course/year selected */}
          {(!selectedCourse || !selectedYear) && (
            <div style={{
              background: '#fff',
              padding: '60px 30px',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              textAlign: 'center',
              borderLeft: '5px solid #f97316',
            }}>
              <FontAwesomeIcon 
                icon={faUsers} 
                style={{ fontSize: 48, color: '#f97316', marginBottom: '16px' }} 
              />
              <h3 style={{ color: '#1e293b', fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                Get Started
              </h3>
              <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
                Please select a course and year level above to view and manage sections
              </p>
            </div>
          )}

          {/* Archived Sections Modal */}
          {showArchivedModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
            }}>
              <div style={{ background: '#fff', borderRadius: 12, width: '92%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(2,6,23,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', borderBottom: '1px solid #eef2ff' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>Archived Sections</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{archivedSections.length} archived section(s)</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={closeArchivedModal} style={{ padding: '8px 12px', background: '#f3f4f6', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Close</button>
                  </div>
                </div>

                <div style={{ padding: 18 }}>
                  {loadingArchived ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Loading archived sections...</div>
                  ) : archivedSections.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No archived sections.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {archivedSections.map((s) => (
                        <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, border: '1px solid #e6eefb' }}>
                          <div>
                            <div style={{ fontWeight: 800 }}>{s.name}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleRestoreSection(s)} style={{ padding: '8px 12px', background: 'linear-gradient(90deg,#059669,#047857)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Restore</button>
                            <button onClick={() => handleDeleteSectionPermanent(s)} style={{ padding: '8px 12px', background: '#ffe4e6', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer' }}>Delete Permanently</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
              zIndex: 1000,
            }}
            onClick={() => {
              if (!addingSection) {
                setShowAddSectionPopup(false);
                setNewSectionName('');
              }
            }}
            >
              <div
                style={{
                  background: 'white',
                  padding: '32px',
                  borderRadius: '18px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                  maxWidth: '500px',
                  width: '90%',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                    Add New Section
                  </h3>
                  <button
                    onClick={() => {
                      if (!addingSection) {
                        setShowAddSectionPopup(false);
                        setNewSectionName('');
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      fontSize: '24px',
                      padding: '4px',
                    }}
                    disabled={addingSection}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>

                <form onSubmit={handleAddSection}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '600', 
                      color: '#374151' 
                    }}>
                      Section Name
                    </label>
                    <input
                      type="text"
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      placeholder="e.g., A, B, C, 1, 2, 3"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#f97316'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      disabled={addingSection}
                      autoFocus
                    />
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    justifyContent: 'flex-end' 
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!addingSection) {
                          setShowAddSectionPopup(false);
                          setNewSectionName('');
                        }
                      }}
                      disabled={addingSection}
                      style={{
                        padding: '12px 24px',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: addingSection ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        opacity: addingSection ? 0.5 : 1,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingSection || !newSectionName.trim()}
                      style={{
                        padding: '12px 24px',
                        background: addingSection || !newSectionName.trim() ? '#d1d5db' : currentCourse.gradient,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: addingSection || !newSectionName.trim() ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                      }}
                    >
                      {addingSection ? 'Adding...' : 'Add Section'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          <ConfirmationDialog
            show={confirmDialog.show}
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null, destructive: false })}
            destructive={confirmDialog.destructive}
          />
        </div>
      </main>
    </div>
  );
};

export default SectionManagement;
