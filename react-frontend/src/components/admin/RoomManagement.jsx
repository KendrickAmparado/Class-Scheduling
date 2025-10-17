import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop, faPlus, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../../styles/RoomManagement.css';

const RoomManagement = () => {
  const navigate = useNavigate();
  const [showAddRoomPopup, setShowAddRoomPopup] = useState(false);

  const comLabs = [
    { id: 1, name: 'ComLab 1', area: 'Finance Building - 3rd Floor', status: 'available' },
    { id: 2, name: 'ComLab 2', area: 'Finance Building - 3rd Floor', status: 'occupied' },
    { id: 3, name: 'ComLab 3', area: 'Finance Building - 3rd Floor', status: 'maintenance' },
    { id: 4, name: 'ComLab 4', area: 'Finance Building - 3rd Floor', status: 'available' },
    { id: 5, name: 'ComLab 5', area: 'Finance Building - 3rd Floor', status: 'occupied' },
    { id: 6, name: 'ComLab 6', area: 'Finance Building - 3rd Floor', status: 'occupied' },
    { id: 7, name: 'ComLab 7', area: 'Finance Building - 3rd Floor', status: 'maintenance' },
    { id: 8, name: 'ComLab 8', area: 'High School Building - 1st Floor', status: 'available' },
    { id: 9, name: 'ComLab 9', area: 'High School Building - 1st Floor', status: 'occupied' },
    { id: 10, name: 'ComLab 10', area: 'High School Building - 1st Floor', status: 'occupied' },
    { id: 11, name: 'ComLab 11', area: 'Finance Building - 3rd Floor', status: 'available' },
    { id: 12, name: 'ComLab 12', area: 'Finance Building - 3rd Floor', status: 'maintenance' }
  ];

  const navigateToRoomDetails = (roomId) => {
    navigate(`/admin/room-schedule/${roomId}`);
  };

  const addRoom = () => {
    setShowAddRoomPopup(true);
  };

  const handleAddRoomSubmit = (roomData) => {
    setShowAddRoomPopup(false);
    alert(`Room added successfully!\nName: ${roomData.name}\nArea: ${roomData.area}`);
  };

  const deleteRoom = () => {
    alert('Delete Room functionality would allow selecting and removing a room from the system.');
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <Header title="Room Management" />
        
        <div style={{padding: '30px', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', minHeight: 'calc(100vh - 80px)', overflowY: 'auto'}}>
          <div style={{background: '#ffffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', marginBottom: '30px', borderLeft: '5px solid #0f2c63'}}>
            <h2 style={{color: '#1e293b', fontSize: '28px', fontWeight: '700', marginBottom: '8px'}}>Room Management</h2>
            <p style={{color: '#64748b', fontSize: '16px', margin: '0'}}>Manage classrooms and computer laboratories</p>
          </div>
          
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '30px'}}>
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
                boxShadow: '0 4px 15px rgba(15, 44, 99, 0.3)'
              }}
              onClick={addRoom}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
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
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
              }}
              onClick={deleteRoom}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <FontAwesomeIcon icon={faTrash} />
              Delete Room
            </button>
          </div>
        
        <div className="dashboard-content">
          <div className="rooms-grid">
            {comLabs.map((lab) => (
              <div
                key={lab.id}
                className="room-card"
                onClick={() => navigateToRoomDetails(lab.id)}
                style={{
                  background: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)'
                }}
              >
                <FontAwesomeIcon icon={faDesktop} />
                <div className="room-title">{lab.name}</div>
                <div className="room-subtitle">{lab.area}</div>
                <div className="room-status">{lab.status.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
        </div>

        {showAddRoomPopup && (
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
              padding: '30px',
              width: '600px',
              maxWidth: '95vw',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '25px',
                borderBottom: '2px solid #f1f5f9',
                paddingBottom: '15px'
              }}>
                <h3 style={{
                  margin: 0,
                  color: '#1e293b',
                  fontSize: '20px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <FontAwesomeIcon icon={faPlus} style={{color: '#0f2c63'}} />
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
                    transition: 'all 0.3s ease'
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

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleAddRoomSubmit({
                  name: formData.get('name'),
                  area: formData.get('area')
                });
              }}>
                <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151'}}>Room Name</label>
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
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0f2c63'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151'}}>Area/Location</label>
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
                        transition: 'border-color 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0f2c63'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '30px',
                  paddingTop: '20px',
                  borderTop: '1px solid #e5e7eb'
                }}>
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
                      transition: 'all 0.3s ease'
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
                      boxShadow: '0 2px 10px rgba(15, 44, 99, 0.3)'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    Add Room
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RoomManagement;