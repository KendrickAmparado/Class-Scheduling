import React, { useState } from 'react';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faTrash, faPlus, faEye, faEdit, faTrashAlt, faUserPlus, faCheck, faTimes, faDownload } from '@fortawesome/free-solid-svg-icons';

const FacultyManagement = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday/Thursday');
  const [showAddInstructorModal, setShowAddInstructorModal] = useState(false);
  const [newInstructorData, setNewInstructorData] = useState({
    id: '',
    name: '',
    contactNumber: '',
    email: ''
  });

  // Sample instructor data
  const [instructors, setInstructors] = useState([
    { id: '10001', name: 'Instructor 1', email: 'Instructor1@buksu.edu.ph', contactNumber: '09123456789', status: 'active' },
    { id: '10002', name: 'Instructor 2', email: 'Instructor2@buksu.edu.ph', contactNumber: '09123456790', status: 'active' },
    { id: '10003', name: 'Instructor 3', email: 'Instructor3@buksu.edu.ph', contactNumber: '09123456791', status: 'active' },
    { id: '10004', name: 'Instructor 4', email: 'Instructor4@buksu.edu.ph', contactNumber: '09123456792', status: 'pending', registrationDate: '2025-10-08' },
    { id: '10005', name: 'Instructor 5', email: 'Instructor5@buksu.edu.ph', contactNumber: '09123456793', status: 'pending', registrationDate: '2025-10-09' },
    { id: '10006', name: 'Instructor 6', email: 'Instructor6@buksu.edu.ph', contactNumber: '09123456794', status: 'deleted', deletedDate: '2025-10-07' },
  ]);

  const filteredInstructors = instructors.filter(instructor => {
    if (activeTab === 'active') return instructor.status === 'active';
    if (activeTab === 'pending') return instructor.status === 'pending';
    if (activeTab === 'trash') return instructor.status === 'deleted';
    return true;
  });

  const handleViewSchedule = (instructorId) => {
    const instructor = instructors.find(inst => inst.id === instructorId);
    setSelectedInstructor(instructor);
    setShowScheduleModal(true);
  };

  const handleEdit = (instructorId) => {
    alert(`Editing instructor ${instructorId}`);
  };

  const handleApprove = (instructorId) => {
    setInstructors(prev => prev.map(inst =>
      inst.id === instructorId ? { ...inst, status: 'active' } : inst
    ));
    alert(`Instructor ${instructorId} has been approved and is now active.`);
  };

  const handleReject = (instructorId) => {
    setInstructors(prev => prev.map(inst =>
      inst.id === instructorId ? { ...inst, status: 'deleted' } : inst
    ));
    alert(`Instructor ${instructorId} has been rejected and moved to trash.`);
  };

  const handleDelete = (instructorId) => {
    if (window.confirm('Are you sure you want to move this instructor to trash?')) {
      setInstructors(prev => prev.map(inst =>
        inst.id === instructorId ? { ...inst, status: 'deleted', deletedDate: new Date().toISOString().split('T')[0] } : inst
      ));
      alert(`Instructor ${instructorId} has been moved to trash.`);
    }
  };

  const handlePermanentDelete = (instructorId) => {
    if (window.confirm('Are you sure you want to permanently delete this instructor? This action cannot be undone.')) {
      setInstructors(prev => prev.filter(inst => inst.id !== instructorId));
      alert(`Instructor ${instructorId} has been permanently deleted.`);
    }
  };

  const handleAddInstructor = () => {
    setShowAddInstructorModal(true);
  };

  const handleAddInstructorSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newInstructorData.id || !newInstructorData.name || !newInstructorData.contactNumber || !newInstructorData.email) {
      alert('Please fill in all required fields.');
      return;
    }

    // Check if ID already exists
    if (instructors.some(inst => inst.id === newInstructorData.id)) {
      alert('An instructor with this ID already exists.');
      return;
    }

    // Add new instructor
    const newInstructor = {
      id: newInstructorData.id,
      name: newInstructorData.name,
      email: newInstructorData.email,
      contactNumber: newInstructorData.contactNumber,
      status: 'active'
    };

    setInstructors(prev => [...prev, newInstructor]);
    
    // Reset form and close modal
    setNewInstructorData({
      id: '',
      name: '',
      contactNumber: '',
      email: ''
    });
    setShowAddInstructorModal(false);
    
    alert(`Instructor ${newInstructor.name} has been added successfully!`);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Faculty Management" />

        <div style={{padding: '30px', background: 'linear-gradient(135deg, #0f2c63 0%, #f97316 100%)', minHeight: 'calc(100vh - 80px)', overflowY: 'auto'}}>
          <div style={{background: '#ffffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', marginBottom: '30px', borderLeft: '5px solid #f97316'}}>
            <h2 style={{margin: '0 0 10px 0', color: '#1e293b', fontSize: '28px', fontWeight: '700'}}>
              <FontAwesomeIcon icon={faUserPlus} style={{marginRight: '15px', color: '#0f2c63'}} />
              Faculty Management
            </h2>
            <p style={{margin: '0', color: '#64748b', fontSize: '16px'}}>Manage instructors and faculty members</p>
          </div>

          {/* Tab Buttons and Add Instructor */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
            <div style={{display: 'flex', gap: '15px'}}>
              <button
                onClick={() => setActiveTab('active')}
                style={{
                  padding: '12px 24px',
                  background: activeTab === 'active' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f1f5f9',
                  color: activeTab === 'active' ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: activeTab === 'active' ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none'
                }}
              >
                Active ({instructors.filter(i => i.status === 'active').length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                style={{
                  padding: '12px 24px',
                  background: activeTab === 'pending' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#f1f5f9',
                  color: activeTab === 'pending' ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: activeTab === 'pending' ? '0 4px 15px rgba(245, 158, 11, 0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FontAwesomeIcon icon={faClock} />
                Pending ({instructors.filter(i => i.status === 'pending').length})
              </button>
              <button
                onClick={() => setActiveTab('trash')}
                style={{
                  padding: '12px 24px',
                  background: activeTab === 'trash' ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' : '#f1f5f9',
                  color: activeTab === 'trash' ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: activeTab === 'trash' ? '0 4px 15px rgba(220, 38, 38, 0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FontAwesomeIcon icon={faTrash} />
                Trash ({instructors.filter(i => i.status === 'deleted').length})
              </button>
            </div>

            <button
              onClick={handleAddInstructor}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(15, 44, 99, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Instructor
            </button>
          </div>

          {/* Instructors Table */}
          <div style={{background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'}}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)', color: 'white'}}>
                  <th style={{padding: '15px', textAlign: 'left', fontWeight: '600', fontSize: '14px'}}>Instructor ID</th>
                  <th style={{padding: '15px', textAlign: 'left', fontWeight: '600', fontSize: '14px'}}>Name</th>
                  <th style={{padding: '15px', textAlign: 'left', fontWeight: '600', fontSize: '14px'}}>Email</th>
                  <th style={{padding: '15px', textAlign: 'center', fontWeight: '600', fontSize: '14px'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstructors.map((instructor, index) => (
                  <tr key={instructor.id} style={{
                    background: index % 2 === 0 ? '#f8fafc' : 'white',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    <td style={{padding: '15px', fontSize: '14px', color: '#374151', fontWeight: '500'}}>
                      {instructor.id}
                    </td>
                    <td style={{padding: '15px', fontSize: '14px', color: '#374151', fontWeight: '500'}}>
                      {instructor.name}
                    </td>
                    <td style={{padding: '15px', fontSize: '14px', color: '#374151'}}>
                      {instructor.email}
                    </td>
                    <td style={{padding: '15px', textAlign: 'center'}}>
                      <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                        {activeTab === 'pending' ? (
                          // Pending tab actions: Approve/Reject
                          <>
                            <button
                              onClick={() => handleApprove(instructor.id)}
                              style={{
                                padding: '8px 12px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                              onMouseOver={(e) => e.target.style.background = '#059669'}
                              onMouseOut={(e) => e.target.style.background = '#10b981'}
                            >
                              <FontAwesomeIcon icon={faCheck} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(instructor.id)}
                              style={{
                                padding: '8px 12px',
                                background: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                              onMouseOver={(e) => e.target.style.background = '#b91c1c'}
                              onMouseOut={(e) => e.target.style.background = '#dc2626'}
                            >
                              <FontAwesomeIcon icon={faTimes} />
                              Reject
                            </button>
                          </>
                        ) : activeTab === 'trash' ? (
                          // Trash tab actions: Only permanent delete
                          <button
                            onClick={() => handlePermanentDelete(instructor.id)}
                            style={{
                              padding: '8px 12px',
                              background: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#b91c1c'}
                            onMouseOut={(e) => e.target.style.background = '#dc2626'}
                          >
                            <FontAwesomeIcon icon={faTrashAlt} />
                            Delete Permanently
                          </button>
                        ) : (
                          // Active tab actions: View Schedule, Edit, Delete (to trash)
                          <>
                            <button
                              onClick={() => handleViewSchedule(instructor.id)}
                              style={{
                                padding: '8px 12px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                              onMouseOver={(e) => e.target.style.background = '#2563eb'}
                              onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                            >
                              <FontAwesomeIcon icon={faEye} />
                              View Schedule
                            </button>
                            <button
                              onClick={() => handleEdit(instructor.id)}
                              style={{
                                padding: '8px 12px',
                                background: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                              onMouseOver={(e) => e.target.style.background = '#d97706'}
                              onMouseOut={(e) => e.target.style.background = '#f59e0b'}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(instructor.id)}
                              style={{
                                padding: '8px 12px',
                                background: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                              onMouseOver={(e) => e.target.style.background = '#b91c1c'}
                              onMouseOut={(e) => e.target.style.background = '#dc2626'}
                            >
                              <FontAwesomeIcon icon={faTrashAlt} />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredInstructors.length === 0 && (
              <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>
                <FontAwesomeIcon icon={faUserPlus} style={{fontSize: '48px', marginBottom: '15px', opacity: '0.5'}} />
                <p>No instructors found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Schedule Modal */}
      {showScheduleModal && selectedInstructor && (
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
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 30px',
              borderBottom: '2px solid #f1f5f9',
              background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
              color: 'white',
              borderRadius: '15px 15px 0 0'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                <h3 style={{
                  margin: '0',
                  fontSize: '20px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <FontAwesomeIcon icon={faEye} />
                  Schedule for {selectedInstructor.name}
                </h3>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <label style={{fontSize: '14px', fontWeight: '500'}}>Day:</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Monday/Thursday">Monday/Thursday</option>
                    <option value="Tuesday/Friday">Tuesday/Friday</option>
                  </select>
                </div>
                <button
                  onClick={() => alert('Download functionality to be implemented')}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <FontAwesomeIcon icon={faDownload} />
                  Download
                </button>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'white',
                  padding: '5px',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'none';
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{padding: '30px'}}>
              {/* Schedule Table */}
              <div style={{background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', minWidth: '1400px'}}>
                  <thead>
                    <tr style={{background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)', color: 'white'}}>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px', minWidth: '100px', position: 'sticky', left: 0, background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)', zIndex: 2}}>Day</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', fontSize: '14px', minWidth: '120px', position: 'sticky', left: '100px', background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)', zIndex: 2}}>Time</th>
                      {Array.from({length: 12}, (_, i) => (
                        <th key={i} style={{padding: '8px', textAlign: 'center', fontWeight: '600', fontSize: '12px', minWidth: '120px'}}>
                          ComLab {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      // Monday - 30 minute intervals
                      { day: 'Monday', time: '7:00 AM - 7:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '7:30 AM - 8:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '8:00 AM - 8:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '8:30 AM - 9:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '9:00 AM - 9:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '9:30 AM - 10:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '10:00 AM - 10:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '10:30 AM - 11:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '11:00 AM - 11:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '11:30 AM - 12:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '12:00 PM - 12:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '12:30 PM - 1:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '1:00 PM - 1:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '1:30 PM - 2:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '2:00 PM - 2:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '2:30 PM - 3:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '3:00 PM - 3:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '3:30 PM - 4:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '4:00 PM - 4:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '4:30 PM - 5:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '5:00 PM - 5:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '5:30 PM - 6:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '6:00 PM - 6:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Monday', time: '6:30 PM - 7:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },

                      // Tuesday - 30 minute intervals
                      { day: 'Tuesday', time: '7:00 AM - 7:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '7:30 AM - 8:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '8:00 AM - 8:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '8:30 AM - 9:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '9:00 AM - 9:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '9:30 AM - 10:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '10:00 AM - 10:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '10:30 AM - 11:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '11:00 AM - 11:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '11:30 AM - 12:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '12:00 PM - 12:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '12:30 PM - 1:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '1:00 PM - 1:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '1:30 PM - 2:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '2:00 PM - 2:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '2:30 PM - 3:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '3:00 PM - 3:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '3:30 PM - 4:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '4:00 PM - 4:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '4:30 PM - 5:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '5:00 PM - 5:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '5:30 PM - 6:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '6:00 PM - 6:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Tuesday', time: '6:30 PM - 7:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },

                      // Wednesday - 30 minute intervals
                      { day: 'Wednesday', time: '7:00 AM - 7:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '7:30 AM - 8:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '8:00 AM - 8:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '8:30 AM - 9:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '9:00 AM - 9:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '9:30 AM - 10:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '10:00 AM - 10:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '10:30 AM - 11:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '11:00 AM - 11:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '11:30 AM - 12:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '12:00 PM - 12:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '12:30 PM - 1:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '1:00 PM - 1:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '1:30 PM - 2:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '2:00 PM - 2:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '2:30 PM - 3:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '3:00 PM - 3:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '3:30 PM - 4:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '4:00 PM - 4:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '4:30 PM - 5:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '5:00 PM - 5:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '5:30 PM - 6:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '6:00 PM - 6:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Wednesday', time: '6:30 PM - 7:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },

                      // Thursday - 30 minute intervals
                      { day: 'Thursday', time: '7:00 AM - 7:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '7:30 AM - 8:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '8:00 AM - 8:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '8:30 AM - 9:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '9:00 AM - 9:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '9:30 AM - 10:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '10:00 AM - 10:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '10:30 AM - 11:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '11:00 AM - 11:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '11:30 AM - 12:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '12:00 PM - 12:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '12:30 PM - 1:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '1:00 PM - 1:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '1:30 PM - 2:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '2:00 PM - 2:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '2:30 PM - 3:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '3:00 PM - 3:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '3:30 PM - 4:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '4:00 PM - 4:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '4:30 PM - 5:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '5:00 PM - 5:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '5:30 PM - 6:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '6:00 PM - 6:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Thursday', time: '6:30 PM - 7:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },

                      // Friday - 30 minute intervals
                      { day: 'Friday', time: '7:00 AM - 7:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '7:30 AM - 8:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '8:00 AM - 8:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '8:30 AM - 9:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '9:00 AM - 9:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '9:30 AM - 10:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '10:00 AM - 10:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '10:30 AM - 11:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '11:00 AM - 11:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '11:30 AM - 12:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '12:00 PM - 12:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '12:30 PM - 1:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '1:00 PM - 1:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '1:30 PM - 2:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '2:00 PM - 2:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '2:30 PM - 3:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '3:00 PM - 3:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '3:30 PM - 4:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '4:00 PM - 4:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '4:30 PM - 5:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '5:00 PM - 5:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '5:30 PM - 6:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '6:00 PM - 6:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Friday', time: '6:30 PM - 7:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },

                      // Saturday - 30 minute intervals
                      { day: 'Saturday', time: '7:00 AM - 7:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '7:30 AM - 8:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '8:00 AM - 8:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '8:30 AM - 9:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '9:00 AM - 9:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '9:30 AM - 10:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '10:00 AM - 10:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '10:30 AM - 11:00 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '11:00 AM - 11:30 AM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '11:30 AM - 12:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '12:00 PM - 12:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '12:30 PM - 1:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '1:00 PM - 1:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '1:30 PM - 2:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '2:00 PM - 2:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '2:30 PM - 3:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '3:00 PM - 3:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '3:30 PM - 4:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '4:00 PM - 4:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '4:30 PM - 5:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '5:00 PM - 5:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '5:30 PM - 6:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '6:00 PM - 6:30 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] },
                      { day: 'Saturday', time: '6:30 PM - 7:00 PM', labs: ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'] }
                    ].filter(slot => {
                      if (selectedDay === 'Monday/Thursday') {
                        return slot.day === 'Monday' || slot.day === 'Thursday';
                      } else if (selectedDay === 'Tuesday/Friday') {
                        return slot.day === 'Tuesday' || slot.day === 'Friday';
                      }
                      return false;
                    }).map((slot, index) => (
                      <tr key={`${slot.day}-${slot.time}`} style={{
                        background: index % 2 === 0 ? '#f8fafc' : 'white',
                        borderBottom: '1px solid #e2e8f0'
                      }}>
                        <td style={{padding: '8px', fontSize: '13px', color: '#374151', fontWeight: '600', background: '#f1f5f9', position: 'sticky', left: 0, zIndex: 1}}>
                          {slot.day}
                        </td>
                        <td style={{padding: '8px', fontSize: '13px', color: '#374151', fontWeight: '500', background: '#f1f5f9', position: 'sticky', left: '100px', zIndex: 1}}>
                          {slot.time}
                        </td>
                        {slot.labs.map((lab, labIndex) => (
                          <td key={labIndex} style={{
                            padding: '6px',
                            fontSize: '11px',
                            textAlign: 'center',
                            color: lab === '-' ? '#64748b' : '#1e40af',
                            fontWeight: lab !== '-' ? '500' : 'normal'
                          }}>
                            {lab}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Instructor Modal */}
      {showAddInstructorModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '32px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <FontAwesomeIcon
                icon={faUserPlus}
                style={{
                  color: '#0f2c63',
                  fontSize: '24px',
                  marginRight: '12px'
                }}
              />
              <h3 style={{
                margin: 0,
                color: '#1e293b',
                fontSize: '20px',
                fontWeight: '700'
              }}>
                Add New Instructor
              </h3>
            </div>

            <form onSubmit={handleAddInstructorSubmit}>
              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '14px'
                }}>
                  ID Number *
                </label>
                <input
                  type="text"
                  value={newInstructorData.id}
                  onChange={(e) => setNewInstructorData({...newInstructorData, id: e.target.value})}
                  placeholder="Enter ID number"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                    transition: 'border-color 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0f2c63'}
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
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newInstructorData.name}
                  onChange={(e) => setNewInstructorData({...newInstructorData, name: e.target.value})}
                  placeholder="Enter full name"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                    transition: 'border-color 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0f2c63'}
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
                  Contact Number *
                </label>
                <input
                  type="tel"
                  value={newInstructorData.contactNumber}
                  onChange={(e) => setNewInstructorData({...newInstructorData, contactNumber: e.target.value})}
                  placeholder="Enter contact number"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                    transition: 'border-color 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0f2c63'}
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
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newInstructorData.email}
                  onChange={(e) => setNewInstructorData({...newInstructorData, email: e.target.value})}
                  placeholder="Enter email address"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                    transition: 'border-color 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0f2c63'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddInstructorModal(false);
                    setNewInstructorData({
                      id: '',
                      name: '',
                      contactNumber: '',
                      email: ''
                    });
                  }}
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
                    background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(15, 44, 99, 0.3)'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <FontAwesomeIcon icon={faPlus} style={{marginRight: '8px'}} />
                  Add Instructor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyManagement;