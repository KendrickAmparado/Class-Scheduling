import React, { useState, useEffect } from 'react';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faDesktop, 
  faPlus, 
  faTrash, 
  faTimes, 
  faDoorOpen,
  faEdit,
  faSearch,
  faCheckCircle,
  faExclamationTriangle,
  faTools
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const RoomManagement = () => {
  const [showAddRoomPopup, setShowAddRoomPopup] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomError, setRoomError] = useState(null);
  const [popup, setPopup] = useState({ show: false, message: '', type: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Add Room form state
  const [newRoom, setNewRoom] = useState({ room: '', area: '', status: 'available' });
  const [addLoading, setAddLoading] = useState(false);

  // Edit room modal and states
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showEditRoomPopup, setShowEditRoomPopup] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Delete room popup state
  const [showDeleteRoomPopup, setShowDeleteRoomPopup] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch rooms from backend
  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await axios.get('http://localhost:5000/api/rooms');
      if (Array.isArray(res.data.rooms)) {
        setRooms(res.data.rooms);
      } else {
        setRooms([]);
        console.warn('Rooms data is not an array');
      }
      setRoomError(null);
    } catch (err) {
      setRoomError('Failed to load rooms');
      console.error(err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();

    // Auto-refresh every 30 seconds
    const autoRefreshInterval = setInterval(fetchRooms, 30000);

    return () => {
      clearInterval(autoRefreshInterval);
    };
  }, []);

  // Add Room handlers
  const addRoom = () => setShowAddRoomPopup(true);
  const updateNewRoomField = (field, value) => {
    setNewRoom((prev) => ({ ...prev, [field]: value }));
  };
  const handleAddRoomSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/rooms', newRoom);
      if (res.data.success) {
        setPopup({ show: true, message: 'Room added successfully!', type: 'success' });
        setShowAddRoomPopup(false);
        setNewRoom({ room: '', area: '', status: 'available' });
        fetchRooms();
      } else {
        setPopup({ show: true, message: res.data.message || 'Failed to add room', type: 'error' });
      }
    } catch (err) {
      console.error('Add room failed:', err);
      setPopup({ show: true, message: 'Server error while adding room.', type: 'error' });
    }
    setAddLoading(false);
    setTimeout(() => setPopup({ show: false, message: '', type: '' }), 3000);
  };

  // Edit Room handlers
  const navigateToRoomDetails = (room) => {
    setSelectedRoom(room);
    setShowEditRoomPopup(true);
  };
  const updateSelectedRoomField = (field, value) => {
    setSelectedRoom((prev) => ({ ...prev, [field]: value }));
  };
  const handleEditRoomSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await axios.put(`http://localhost:5000/api/rooms/${selectedRoom._id}`, selectedRoom);
      if (res.data.success) {
        setPopup({ show: true, message: 'Room updated successfully!', type: 'success' });
        setShowEditRoomPopup(false);
        fetchRooms();
      } else {
        setPopup({ show: true, message: res.data.message || 'Failed to update room', type: 'error' });
      }
    } catch (err) {
      console.error('Update room failed:', err);
      setPopup({ show: true, message: 'Server error while updating room.', type: 'error' });
    }
    setEditLoading(false);
    setTimeout(() => setPopup({ show: false, message: '', type: '' }), 3000);
  };

  // Delete Room handlers
  const openDeleteRoomPopup = () => {
    setRoomToDelete(null);
    setShowDeleteRoomPopup(true);
  };
  const handleDeleteRoom = async () => {
    if (!roomToDelete) {
      setPopup({ show: true, message: 'Please select a room to delete.', type: 'error' });
      setTimeout(() => setPopup({ show: false, message: '', type: '' }), 3000);
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await axios.delete(`http://localhost:5000/api/rooms/${roomToDelete._id}`);
      if (res.data.success) {
        setPopup({ show: true, message: 'Room deleted successfully!', type: 'success' });
        setShowDeleteRoomPopup(false);
        fetchRooms();
      } else {
        setPopup({ show: true, message: res.data.message || 'Failed to delete room', type: 'error' });
      }
    } catch (err) {
      console.error('Delete room failed:', err);
      setPopup({ show: true, message: 'Server error while deleting room.', type: 'error' });
    }
    setDeleteLoading(false);
    setTimeout(() => setPopup({ show: false, message: '', type: '' }), 3000);
  };

  // Filter rooms based on search and status
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch(status) {
      case 'available': return faCheckCircle;
      case 'occupied': return faExclamationTriangle;
      case 'maintenance': return faTools;
      default: return faCheckCircle;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
      case 'occupied': return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
      case 'maintenance': return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      default: return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
    }
  };

  return (
    <>
      <div className="dashboard-container" style={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <main className="main-content" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
          <Header title="Room Management" />

          {/* Popup for success/error messages */}
          {popup.show && (
            <div
              style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                backgroundColor: popup.type === 'success' ? '#d1fae5' : '#fee2e2',
                color: popup.type === 'success' ? '#065f46' : '#991b1b',
                border: `2px solid ${popup.type === 'success' ? '#10b981' : '#f87171'}`,
                padding: '16px 24px',
                borderRadius: '12px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                fontWeight: '600',
                zIndex: 10000,
                minWidth: '280px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '15px',
              }}
            >
              <FontAwesomeIcon icon={popup.type === 'success' ? faCheckCircle : faExclamationTriangle} />
              {popup.message}
            </div>
          )}

          <div className="dashboard-content">
            {/* Welcome Section */}
            <div className="welcome-section" style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <FontAwesomeIcon 
                  icon={faDoorOpen} 
                  style={{ fontSize: 32, color: '#f97316' }}
                />
                <h2 style={{ margin: 0 }}>Room Management</h2>
              </div>
              <p style={{ margin: 0 }}>Manage classrooms and computer laboratories</p>
            </div>

            {/* Stats and Actions Card */}
            <div style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '18px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderLeft: '5px solid #f97316',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                    Rooms Overview
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>
                    Total: {rooms.length} room(s)
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(15, 44, 99, 0.3)',
                    }}
                    onClick={addRoom}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    Add Room
                  </button>
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    }}
                    onClick={openDeleteRoomPopup}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Delete Room
                  </button>
                </div>
              </div>

              {/* Search and Filter */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    style={{ 
                      position: 'absolute', 
                      left: '14px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#6b7280',
                      fontSize: '16px'
                    }} 
                  />
                  <input
                    type="text"
                    placeholder="Search rooms by name or area..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 44px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    minWidth: '180px',
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            {/* Rooms Grid */}
            {loadingRooms ? (
              <div style={{
                background: '#fff',
                padding: '60px 30px',
                borderRadius: '18px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                textAlign: 'center',
                borderLeft: '5px solid #f97316',
              }}>
                <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>Loading rooms...</p>
              </div>
            ) : roomError ? (
              <div style={{
                background: '#fff',
                padding: '60px 30px',
                borderRadius: '18px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                textAlign: 'center',
                borderLeft: '5px solid #ef4444',
              }}>
                <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: 48, color: '#ef4444', marginBottom: '16px' }} />
                <p style={{ color: '#991b1b', fontSize: '16px', margin: 0 }}>{roomError}</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div style={{
                background: '#fff',
                padding: '60px 30px',
                borderRadius: '18px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                textAlign: 'center',
                borderLeft: '5px solid #f97316',
              }}>
                <FontAwesomeIcon icon={faDoorOpen} style={{ fontSize: 48, color: '#f97316', marginBottom: '16px' }} />
                <h3 style={{ color: '#1e293b', fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                  No Rooms Found
                </h3>
                <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'Start by adding a new room'}
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
              }}>
                {filteredRooms.map((room) => {
                  const statusColors = getStatusColor(room.status);
                  return (
                    <div
                      key={room._id}
                      onClick={() => navigateToRoomDetails(room)}
                      style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        border: '2px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.12)';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                        e.currentTarget.style.borderColor = '#f1f5f9';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '16px'
                      }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '24px',
                        }}>
                          <FontAwesomeIcon icon={faDesktop} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#1e293b',
                            margin: '0 0 4px 0',
                          }}>
                            {room.room}
                          </h4>
                          <p style={{
                            fontSize: '14px',
                            color: '#64748b',
                            margin: 0,
                          }}>
                            {room.area}
                          </p>
                        </div>
                      </div>

                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: statusColors.bg,
                        color: statusColors.text,
                        border: `2px solid ${statusColors.border}`,
                        fontWeight: '600',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        <FontAwesomeIcon icon={getStatusIcon(room.status)} style={{ fontSize: '14px' }} />
                        {room.status}
                      </div>

                      <div style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3b82f6',
                      }}>
                        <FontAwesomeIcon icon={faEdit} style={{ fontSize: '16px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Room Popup Modal */}
      {showAddRoomPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowAddRoomPopup(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '32px',
              borderRadius: '18px',
              width: '480px',
              maxWidth: '90vw',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Add New Room</h3>
              <button
                onClick={() => setShowAddRoomPopup(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleAddRoomSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoom.room}
                  onChange={(e) => updateNewRoomField('room', e.target.value)}
                  required
                  placeholder="e.g., ComLab 1"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Area/Location
                </label>
                <input
                  type="text"
                  value={newRoom.area}
                  onChange={(e) => updateNewRoomField('area', e.target.value)}
                  required
                  placeholder="e.g., 3rd Floor, Main Building"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Status
                </label>
                <select
                  value={newRoom.status}
                  onChange={(e) => updateNewRoomField('status', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                  required
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddRoomPopup(false)}
                  style={{ 
                    padding: '12px 24px',
                    border: '2px solid #e5e7eb',
                    background: 'white',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#374151',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  style={{ 
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: addLoading ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                  }}
                >
                  {addLoading ? 'Adding...' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Popup Modal */}
      {showEditRoomPopup && selectedRoom && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowEditRoomPopup(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '32px',
              borderRadius: '18px',
              width: '480px',
              maxWidth: '90vw',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Edit Room Details</h3>
              <button
                onClick={() => setShowEditRoomPopup(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleEditRoomSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Room Name
                </label>
                <input
                  type="text"
                  value={selectedRoom.room}
                  onChange={(e) => updateSelectedRoomField('room', e.target.value)}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Area/Location
                </label>
                <input
                  type="text"
                  value={selectedRoom.area}
                  onChange={(e) => updateSelectedRoomField('area', e.target.value)}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Status
                </label>
                <select
                  value={selectedRoom.status}
                  onChange={(e) => updateSelectedRoomField('status', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                  required
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditRoomPopup(false)}
                  style={{ 
                    padding: '12px 24px',
                    border: '2px solid #e5e7eb',
                    background: 'white',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#374151',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{ 
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: editLoading ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                  }}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Room Popup Modal */}
      {showDeleteRoomPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowDeleteRoomPopup(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '32px',
              borderRadius: '18px',
              width: '480px',
              maxWidth: '90vw',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#991b1b', margin: 0 }}>Delete Room</h3>
              <button
                onClick={() => setShowDeleteRoomPopup(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <p style={{ color: '#374151', fontSize: '15px', marginBottom: '20px' }}>
              Please select a room to delete:
            </p>

            <select
              value={roomToDelete ? roomToDelete._id : ''}
              onChange={(e) => {
                const selectedId = e.target.value;
                const selected = rooms.find((r) => r._id === selectedId);
                setRoomToDelete(selected || null);
              }}
              style={{ 
                width: '100%', 
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '15px',
                marginBottom: '24px',
                cursor: 'pointer',
              }}
            >
              <option value="" disabled>
                -- Select a room --
              </option>
              {rooms.map((room) => (
                <option key={room._id} value={room._id}>
                  {room.room} ({room.area})
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteRoomPopup(false)}
                style={{ 
                  padding: '12px 24px',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#374151',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRoom}
                disabled={deleteLoading || !roomToDelete}
                style={{ 
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: (deleteLoading || !roomToDelete) ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  opacity: (deleteLoading || !roomToDelete) ? 0.6 : 1,
                }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomManagement;
