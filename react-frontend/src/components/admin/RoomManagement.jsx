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

  // Fetch rooms from backend
  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await axios.get('http://localhost:5000/api/rooms');
      if (Array.isArray(res.data.rooms)) {
        setRooms(res.data.rooms);
      } else if (res.data.rooms && Array.isArray(res.data.rooms)) {
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

  const navigateToRoomDetails = (roomId) => {
    navigate(`/admin/room-schedule/${roomId}`);
  };

  const addRoom = () => {
    setShowAddRoomPopup(true);
  };

  // Handle add room form submit
  const handleAddRoomSubmit = async (roomData) => {
    try {
      const res = await axios.post('http://localhost:5000/api/rooms', roomData);
      if (res.data.success) {
        setPopup({ show: true, message: 'Room added successfully!', type: 'success' });
        setShowAddRoomPopup(false);
        fetchRooms();
      } else {
        setPopup({ show: true, message: res.data.message || 'Failed to add room', type: 'error' });
      }
    } catch (err) {
      console.error('Add room failed:', err);
      setPopup({ show: true, message: 'Server error while adding room.', type: 'error' });
    }
    setTimeout(() => setPopup({ show: false, message: '', type: '' }), 3000);
  };

  const deleteRoom = () => {
    alert('Delete Room functionality would allow selecting and removing a room from the system.');
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
                onClick={deleteRoom}
                onMouseOver={(e) => (e.target.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => (e.target.style.transform = 'translateY(0)')}
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete Room
              </button>
            </div>

            {loadingRooms && <p>Loading rooms...</p>}
            {roomError && <p style={{ color: 'red' }}>{roomError}</p>}

            <div className="dashboard-content">
              <div
                className="rooms-grid"
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
                      onClick={() => navigateToRoomDetails(room._id)}
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
          </div>
        </main>
      </div>

      {showAddRoomPopup && (
        <div
          style={{
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
        >
          <div
            style={{
              background: 'white',
              borderRadius: '15px',
              padding: '30px',
              width: '600px',
              maxWidth: '95vw',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '25px',
                borderBottom: '2px solid #f1f5f9',
                paddingBottom: '15px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: '#1e293b',
                  fontSize: '20px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <FontAwesomeIcon icon={faPlus} style={{ color: '#0f2c63' }} />
                Add New Room
              </h3>
              <button
                onClick={() => setShowAddRoomPopup(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '5px',
                  borderRadius: '50%',
                  width: '35px',
                  height: '35px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#f1f5f9';
                  e.target.style.color = '#374151';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'none';
                  e.target.style.color = '#64748b';
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleAddRoomSubmit({
                  room: formData.get('name'),
                  area: formData.get('area'),
                  status: 'available',
                });
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#374151',
                    }}
                  >
                    Room Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.3s ease',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0f2c63')}
                    onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#374151',
                    }}
                  >
                    Area/Location
                  </label>
                  <input
                    type="text"
                    name="area"
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.3s ease',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0f2c63')}
                    onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '30px',
                  paddingTop: '20px',
                  borderTop: '1px solid #e5e7eb',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddRoomPopup(false)}
                  style={{
                    padding: '10px 20px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#e5e7eb';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#f3f4f6';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 10px rgba(15, 44, 99, 0.3)',
                  }}
                  onMouseOver={(e) => (e.target.style.transform = 'translateY(-1px)')}
                  onMouseOut={(e) => (e.target.style.transform = 'translateY(0)')}
                >
                  Add Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomManagement;
