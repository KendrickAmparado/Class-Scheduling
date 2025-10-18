import React, { useState } from 'react';
import InstructorSidebar from '../common/InstructorSidebar.jsx';
import InstructorHeader from '../common/InstructorHeader.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faLock, faCamera, faSave } from '@fortawesome/free-solid-svg-icons';

const InstructorSettings = () => {
  const [profileData, setProfileData] = useState({
    name: 'Dr. Name Instructor',
    age: '35',
    contactNumber: '+63 912 345 6789',
    email: 'name.instructor@buksu.edu.ph',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileImage, setProfileImage] = useState('/images/tiger.png');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    alert('Profile updated successfully!');
  };

  const handleChangePassword = () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (profileData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }
    alert('Password changed successfully!');
    setProfileData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <InstructorSidebar />
      <main style={{flex: 1, background: 'linear-gradient(to right, #0f2c63 0%, #f97316 100%)', overflowY: 'auto'}}>
        <InstructorHeader />

        <div style={{padding: '30px', background: 'linear-gradient(to right, #0f2c63 0%, #f97316 100%)', minHeight: 'calc(100vh - 80px)', overflowY: 'auto'}}>
          <div style={{background: '#ffffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', marginBottom: '30px', borderLeft: '5px solid #f97316'}}>
            <h2 style={{color: '#1e293b', fontSize: '28px', fontWeight: '700', marginBottom: '8px'}}>Settings</h2>
            <p style={{color: '#64748b', fontSize: '16px', margin: '0'}}>Manage your account settings</p>
          </div>

          {/* Profile Picture and Basic Info */}
          <div style={{background: '#ffffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', marginBottom: '30px', borderLeft: '5px solid #f97316'}}>
            <h3 style={{color: '#1e293b', fontSize: '24px', fontWeight: '600', marginBottom: '25px'}}>Profile Information</h3>

            <div style={{display: 'flex', gap: '40px', alignItems: 'flex-start'}}>
              {/* Profile Picture Section */}
              <div style={{textAlign: 'center'}}>
                <div style={{position: 'relative', display: 'inline-block'}}>
                  <div style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '4px solid #f97316',
                    boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
                    marginBottom: '15px'
                  }}>
                    <img
                      src={profileImage}
                      alt="Profile"
                      style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                  </div>
                  <label style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '10px',
                    background: '#f97316',
                    color: 'white',
                    borderRadius: '50%',
                    width: '35px',
                    height: '35px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
                    transition: 'all 0.3s ease'
                  }}>
                    <FontAwesomeIcon icon={faCamera} style={{fontSize: '14px'}} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{display: 'none'}}
                    />
                  </label>
                </div>
                <p style={{color: '#64748b', fontSize: '14px', margin: '0'}}>Click camera icon to upload new photo</p>
              </div>

              {/* Profile Form */}
              <div style={{flex: 1}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px'}}>
                  <div>
                    <label style={{display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px'}}>
                      <FontAwesomeIcon icon={faUser} style={{marginRight: '8px', color: '#f97316'}} />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#374151',
                        background: '#ffffff',
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#f97316'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div>
                    <label style={{display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px'}}>
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={profileData.age}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#374151',
                        background: '#ffffff',
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#f97316'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div>
                    <label style={{display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px'}}>
                      <FontAwesomeIcon icon={faPhone} style={{marginRight: '8px', color: '#f97316'}} />
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={profileData.contactNumber}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#374151',
                        background: '#ffffff',
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#f97316'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div>
                    <label style={{display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px'}}>
                      <FontAwesomeIcon icon={faEnvelope} style={{marginRight: '8px', color: '#f97316'}} />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#374151',
                        background: '#ffffff',
                        transition: 'border-color 0.3s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#f97316'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 25px',
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
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <FontAwesomeIcon icon={faSave} />
                  Save Profile Changes
                </button>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div style={{background: '#ffffffff', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', borderLeft: '5px solid #f97316'}}>
            <h3 style={{color: '#1e293b', fontSize: '24px', fontWeight: '600', marginBottom: '25px'}}>
              <FontAwesomeIcon icon={faLock} style={{marginRight: '12px', color: '#f97316'}} />
              Change Password
            </h3>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '25px'}}>
              <div>
                <label style={{display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px'}}>
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={profileData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="Enter current password"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#374151',
                    background: '#ffffff',
                    transition: 'border-color 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#f97316'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label style={{display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px'}}>
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={profileData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Enter new password"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#374151',
                    background: '#ffffff',
                    transition: 'border-color 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#f97316'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div>
                <label style={{display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px'}}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={profileData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#374151',
                    background: '#ffffff',
                    transition: 'border-color 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#f97316'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            <button
              onClick={handleChangePassword}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 25px',
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <FontAwesomeIcon icon={faLock} />
              Change Password
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstructorSettings;