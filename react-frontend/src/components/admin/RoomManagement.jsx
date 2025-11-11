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
  faCheckCircle,
  faExclamationTriangle,
  faTools
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useToast } from '../common/ToastProvider.jsx';
import ConfirmationDialog from '../common/ConfirmationDialog.jsx';
import { SkeletonCard } from '../common/SkeletonLoader.jsx';
import EmptyState from '../common/EmptyState.jsx';

const RoomManagement = () => {
  const { showToast } = useToast();
  const [showAddRoomPopup, setShowAddRoomPopup] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomError, setRoomError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'room', direction: 'asc' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null, destructive: false });

  // Add Room form state
  const [newRoom, setNewRoom] = useState({ room: '', area: '', status: 'available' });
  const [addLoading, setAddLoading] = useState(false);

  // Edit room modal and states
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showEditRoomPopup, setShowEditRoomPopup] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

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

  // Initialize search from URL query (?q=)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setSearchQuery(q);
  }, []);

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
        showToast('Room added successfully!', 'success');
        setShowAddRoomPopup(false);
        setNewRoom({ room: '', area: '', status: 'available' });
        fetchRooms();
      } else {
        showToast(res.data.message || 'Failed to add room', 'error');
      }
    } catch (err) {
      console.error('Add room failed:', err);
      showToast('Server error while adding room.', 'error');
    }
    setAddLoading(false);
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
        showToast('Room updated successfully!', 'success');
        setShowEditRoomPopup(false);
        fetchRooms();
      } else {
        showToast(res.data.message || 'Failed to update room', 'error');
      }
    } catch (err) {
      console.error('Update room failed:', err);
      showToast('Server error while updating room.', 'error');
    }
    setEditLoading(false);
  };

  // Delete Room handlers
  const handleDeleteRoom = (room) => {
    setConfirmDialog({
      show: true,
      title: 'Delete Room',
      message: `Are you sure you want to delete room "${room.room}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await axios.delete(`http://localhost:5000/api/rooms/${room._id}`);
          if (res.data.success) {
            showToast('Room deleted successfully!', 'success');
            fetchRooms();
          } else {
            showToast(res.data.message || 'Failed to delete room', 'error');
          }
        } catch (err) {
          console.error('Delete room failed:', err);
          showToast('Server error while deleting room.', 'error');
        }
        setConfirmDialog({ show: false, title: '', message: '', onConfirm: null, destructive: false });
      },
      destructive: true,
    });
  };

  // Get unique areas for filter
  const areas = [...new Set(rooms.map(room => room.area).filter(Boolean))].sort();

  // Filter and sort rooms
  let filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchesArea = areaFilter === 'all' || room.area === areaFilter;
    return matchesSearch && matchesStatus && matchesArea;
  });

  // Sort rooms
  filteredRooms = [...filteredRooms].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue || '').toLowerCase();
    }

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
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

          {/* Popup removed - using Toast system now */}

          <div className="dashboard-content" style={{ marginTop: '140px' }}>
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
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
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
                    minWidth: '160px',
                    background: '#fff'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    minWidth: '160px',
                    background: '#fff'
                  }}
                >
                  <option value="all">All Areas</option>
                  {areas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                <select
                  value={`${sortConfig.key}-${sortConfig.direction}`}
                  onChange={(e) => {
                    const [key, direction] = e.target.value.split('-');
                    setSortConfig({ key, direction });
                  }}
                  style={{
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    minWidth: '160px',
                    background: '#fff'
                  }}
                >
                  <option value="room-asc">Sort: Room (A-Z)</option>
                  <option value="room-desc">Sort: Room (Z-A)</option>
                  <option value="area-asc">Sort: Area (A-Z)</option>
                  <option value="area-desc">Sort: Area (Z-A)</option>
                  <option value="status-asc">Sort: Status (A-Z)</option>
                  <option value="status-desc">Sort: Status (Z-A)</option>
                </select>
              </div>
            </div>

            {/* Rooms Grid */}
            {loadingRooms ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
              }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
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
              <EmptyState
                icon={faDoorOpen}
                title={searchQuery || statusFilter !== 'all' ? 'No rooms found' : 'No rooms yet'}
                message={searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria to find rooms.'
                  : 'Get started by adding your first room to the system.'}
                actionLabel={searchQuery || statusFilter !== 'all' ? undefined : 'Add Your First Room'}
                onAction={searchQuery || statusFilter !== 'all' ? undefined : () => setShowAddRoomPopup(true)}
              />
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
                        display: 'flex',
                        gap: '8px',
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToRoomDetails(room);
                          }}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title="Edit Room"
                        >
                          <FontAwesomeIcon icon={faEdit} style={{ fontSize: '14px' }} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRoom(room);
                          }}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ef4444',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          title="Delete Room"
                        >
                          <FontAwesomeIcon icon={faTrash} style={{ fontSize: '14px' }} />
                        </button>
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null, destructive: false })}
        destructive={confirmDialog.destructive}
        confirmText={confirmDialog.destructive ? "Delete" : "Confirm"}
      />
    </>
  );
};

export default RoomManagement;
