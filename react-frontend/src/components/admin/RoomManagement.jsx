import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop, faPlus, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import '../../styles/RoomManagement.css';

const RoomManagement = () => {
  const navigate = useNavigate();
  const [showAddRoomPopup, setShowAddRoomPopup] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomError, setRoomError] = useState(null);
  const [popup, setPopup] = useState({ show: false, message: '', type: '' });

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

  return (
    <>
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
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
                padding: '12px 24px',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                fontWeight: '600',
                zIndex: 10000,
                minWidth: '250px',
                textAlign: 'center',
              }}
            >
              {popup.message}
            </div>
          )}

          <div
            style={{
              padding: '30px',
              background: 'linear-gradient(135deg, #0f2c63 0%, #f97316 100%)',
              minHeight: 'calc(100vh - 80px)',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                background: '#ffffffff',
                padding: '30px',
                borderRadius: '15px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                marginBottom: '30px',
                borderLeft: '5px solid #f97316',
              }}
            >
              <h2 style={{ color: '#1e293b', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
                Room Management
              </h2>
              <p style={{ color: '#64748b', fontSize: '16px', margin: '0' }}>
                Manage classrooms and computer laboratories
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '30px' }}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(15, 44, 99, 0.3)',
                }}
                onClick={addRoom}
                onMouseOver={(e) => (e.target.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => (e.target.style.transform = 'translateY(0)')}
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
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                }}
                onClick={openDeleteRoomPopup}
                onMouseOver={(e) => (e.target.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => (e.target.style.transform = 'translateY(0)')}
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete Room
              </button>
            </div>

            {loadingRooms && <p>Loading rooms...</p>}
            {roomError && <p style={{ color: 'red' }}>{roomError}</p>}

            <div
              className="dashboard-content"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '24px',
                padding: '10px',
              }}
            >
              {rooms.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '16px', margin: '20px' }}>No rooms available.</p>
              ) : (
                rooms.map((room) => (
                  <div
                    key={room._id}
                    className="room-card"
                    onClick={() => navigateToRoomDetails(room)}
                    style={{
                      background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                      cursor: 'pointer',
                      borderRadius: '15px',
                      color: 'white',
                      padding: '20px',
                      boxShadow: '0 8px 24px rgba(15, 44, 99, 0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      transition: 'transform 0.2s ease',
                      userSelect: 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <FontAwesomeIcon icon={faDesktop} size="3x" style={{ marginBottom: '15px' }} />
                    <div
                      className="room-title"
                      style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px', textAlign: 'center' }}
                      title={room.room}
                    >
                      {room.room}
                    </div>
                    <div
                      className="room-subtitle"
                      style={{ fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginBottom: '14px', textAlign: 'center' }}
                      title={room.area}
                    >
                      {room.area}
                    </div>
                    <div
                      className="room-status"
                      style={{
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontWeight: '700',
                        fontSize: '13px',
                        letterSpacing: '0.85px',
                        textTransform: 'uppercase',
                        width: 'fit-content',
                        backgroundColor:
                          room.status === 'available'
                            ? 'rgba(52, 211, 153, 0.85)'
                            : room.status === 'occupied'
                            ? 'rgba(239, 68, 68, 0.85)'
                            : 'rgba(245, 158, 11, 0.85)',
                        color: 'white',
                        userSelect: 'none',
                        marginTop: 'auto',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                      }}
                      title={`Status: ${room.status}`}
                    >
                      {room.status}
                    </div>
                  </div>
                ))
              )}
            </div>
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
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAddRoomPopup(false)}
        >
          <div
            style={{
              background: 'white',
              padding: 30,
              borderRadius: 15,
              width: '400px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Add New Room</h3>
            <form onSubmit={handleAddRoomSubmit}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Room Name
                <input
                  type="text"
                  value={newRoom.room}
                  onChange={(e) => updateNewRoomField('room', e.target.value)}
                  required
                  style={{ width: '100%', marginBottom: 12, padding: 8 }}
                />
              </label>

              <label style={{ display: 'block', marginBottom: 8 }}>
                Area/Location
                <input
                  type="text"
                  value={newRoom.area}
                  onChange={(e) => updateNewRoomField('area', e.target.value)}
                  required
                  style={{ width: '100%', marginBottom: 12, padding: 8 }}
                />
              </label>

              <label style={{ display: 'block', marginBottom: 12 }}>
                Status
                <select
                  value={newRoom.status}
                  onChange={(e) => updateNewRoomField('status', e.target.value)}
                  style={{ width: '100%', padding: 8 }}
                  required
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAddRoomPopup(false)}
                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  style={{ padding: '8px 16px', cursor: addLoading ? 'not-allowed' : 'pointer' }}
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
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowEditRoomPopup(false)}
        >
          <div
            style={{
              background: 'white',
              padding: 30,
              borderRadius: 15,
              width: '400px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Edit Room Details</h3>
            <form onSubmit={handleEditRoomSubmit}>
              <label style={{ display: 'block', marginBottom: 8 }}>
                Room Name
                <input
                  type="text"
                  value={selectedRoom.room}
                  onChange={(e) => updateSelectedRoomField('room', e.target.value)}
                  required
                  style={{ width: '100%', marginBottom: 12, padding: 8 }}
                />
              </label>

              <label style={{ display: 'block', marginBottom: 8 }}>
                Area/Location
                <input
                  type="text"
                  value={selectedRoom.area}
                  onChange={(e) => updateSelectedRoomField('area', e.target.value)}
                  required
                  style={{ width: '100%', marginBottom: 12, padding: 8 }}
                />
              </label>

              <label style={{ display: 'block', marginBottom: 12 }}>
                Status
                <select
                  value={selectedRoom.status}
                  onChange={(e) => updateSelectedRoomField('status', e.target.value)}
                  style={{ width: '100%', padding: 8 }}
                  required
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowEditRoomPopup(false)}
                  style={{ padding: '8px 16px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{ padding: '8px 16px', cursor: editLoading ? 'not-allowed' : 'pointer' }}
                >
                  {editLoading ? 'Saving...' : 'Save'}
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
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowDeleteRoomPopup(false)}
        >
          <div
            style={{
              background: 'white',
              padding: 30,
              borderRadius: 15,
              width: '400px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete Room</h3>
            <p>Please select a room to delete:</p>
            <select
              value={roomToDelete ? roomToDelete._id : ''}
              onChange={(e) => {
                const selectedId = e.target.value;
                const selected = rooms.find((r) => r._id === selectedId);
                setRoomToDelete(selected || null);
              }}
              style={{ width: '100%', padding: 8, marginBottom: 20 }}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => setShowDeleteRoomPopup(false)}
                style={{ padding: '8px 16px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRoom}
                disabled={deleteLoading || !roomToDelete}
                style={{ padding: '8px 16px', cursor: deleteLoading || !roomToDelete ? 'not-allowed' : 'pointer' }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomManagement;
