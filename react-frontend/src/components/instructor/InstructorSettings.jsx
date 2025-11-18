import React, { useState, useEffect, useContext, useCallback } from 'react';
import InstructorSidebar from '../common/InstructorSidebar.jsx';
import InstructorHeader from '../common/InstructorHeader.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faIdCard } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext.jsx';

const InstructorSettings = () => {
  const { userEmail } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    instructorId: '',
    firstname: '',
    lastname: '',
    contact: '',
    email: '',
    department: '',
    image: ''
  });

  const [profileImage, setProfileImage] = useState('/images/tiger.png');
  const [saving, setSaving] = useState(false);
  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  const resolveImageUrl = useCallback((value) => {
    if (!value) return '/images/tiger.png';
    if (value.startsWith('http')) return value;
    if (value.startsWith('/uploads/')) return `${apiBase}${value}`;
    return value;
  }, [apiBase]);

  const getToken = () => {
    // Prefer 'token'; fallback to legacy 'instructorToken'
    return localStorage.getItem('token') || localStorage.getItem('instructorToken') || '';
  };

  const ensureAuthenticated = async () => {
    const token = getToken();
    if (!token) return { ok: false, status: 401 };
    try {
      const res = await fetch(`${apiBase}/api/instructors/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { ok: res.ok, status: res.status };
    } catch (e) {
      return { ok: false, status: 0 };
    }
  };

  useEffect(() => {
    const fetchProfileData = () => {
      if (!userEmail) {
        console.log('No userEmail available yet');
        return;
      }

      console.log('Fetching instructor profile (me) via JWT');
      const token = getToken();
      fetch(`${apiBase}/api/instructors/profile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async res => {
          console.log('Profile response status:', res.status);
          if (res.ok) return res.json();
          // fallback to by-email if JWT endpoint fails
          const fb = await fetch(`${apiBase}/api/instructors/profile/by-email/${encodeURIComponent(userEmail)}`);
          if (!fb.ok) throw new Error(`Failed to fetch profile data: ${res.status} ${res.statusText}`);
          return fb.json();
        })
        .then(data => {
          console.log('Profile data received:', data);
          setProfileData({
            instructorId: data.instructorId || '',
            firstname: data.firstname || '',
            lastname: data.lastname || '',
            contact: data.contact || '',
            email: data.email || '',
            department: data.department || '',
            image: data.image || ''
          });
          setProfileImage(resolveImageUrl(data.image));
        })
        .catch(error => {
          console.error('Error fetching profile data:', error);
          // Set some default values to prevent empty state
          setProfileData({
            instructorId: 'Error',
            firstname: 'Error',
            lastname: 'Loading...',
            contact: '',
            email: userEmail || '',
            department: '',
            image: ''
          });
        });
    };

    fetchProfileData();
  }, [userEmail, apiBase, resolveImageUrl]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const token = getToken();
      const res = await fetch(`${apiBase}/api/instructors/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstname: profileData.firstname,
          lastname: profileData.lastname,
          contact: profileData.contact,
          department: profileData.department
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update profile');
      }
      setProfileData(prev => ({ ...prev, ...data.instructor }));
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Client-side validation to give immediate feedback
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxBytes = 20 * 1024 * 1024; // 20MB
    if (!allowed.includes(file.type)) {
      alert('Unsupported file type. Please use JPG, PNG, GIF, or WEBP.');
      return;
    }
    if (file.size > maxBytes) {
      alert('File too large. Please use an image under 20MB.');
      return;
    }
    try {
      const token = getToken();
      if (!token) {
        alert('You are not logged in. Please login again.');
        return;
      }
      const auth = await ensureAuthenticated();
      if (!auth.ok) {
        if (auth.status === 401) {
          alert('Session expired or invalid token. Please login again.');
        } else {
          alert('Unable to verify your session. Please try again.');
        }
        return;
      }
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${apiBase}/api/instructors/profile/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload image');
      }
      const newUrl = data.image ? resolveImageUrl(data.image) : URL.createObjectURL(file);
      setProfileImage(newUrl);
      setProfileData(prev => ({ ...prev, image: data.image || prev.image }));
    } catch (err) {
      console.error('Image upload failed:', err);
      alert(`Image upload failed: ${err.message || 'Please use a JPG/PNG/GIF/WEBP under 20MB.'}`);
    }
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh' }}>
      <InstructorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
        <InstructorHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="dashboard-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', marginTop: '140px' }}>
          <div
            style={{
              background: '#fff',
              padding: '40px',
              borderRadius: '20px',
              boxShadow: '0 4px 25px rgba(0,0,0,0.1)',
              width: '100%',
              maxWidth: '850px',
              borderLeft: '6px solid #f97316',
            }}
          >
            <h2
              style={{
                color: '#1e293b',
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '8px',
              }}
            >
              Profile Information
            </h2>
            <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '25px' }}>
              View your account details
            </p>

            {/* Profile Content */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '40px',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Profile Picture */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '4px solid #f97316',
                    boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)',
                    marginBottom: '15px',
                  }}
                >
                  <img
                    src={profileImage}
                    alt="Profile"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="profileImageInput"
                    style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #0f2c63 0%, #f97316 100%)',
                      color: 'white',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(15, 44, 99, 0.25)'
                    }}
                  >
                    Change Photo
                  </label>
                  <input id="profileImageInput" type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                </div>
              </div>

              {/* Account Details */}
              <div
                style={{
                  flex: 1,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '25px 30px',
                }}
              >
                {/* Instructor Information Fields */}
                {/* Instructor ID (read-only) */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '5px',
                    }}
                  >
                    <FontAwesomeIcon icon={faIdCard} style={{ marginRight: '8px', color: '#f97316' }} />
                    Instructor ID
                  </label>
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #0f2c63 0%, #f97316 100%)',
                      color: 'white',
                      padding: '10px 15px',
                      borderRadius: '10px',
                      border: 'none',
                      fontSize: '16px',
                      fontWeight: '500',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)'
                    }}
                  >
                    {profileData.instructorId ? `ID-${profileData.instructorId}` : 'Not available'}
                  </div>
                </div>

                {/* First Name */}
                <div>
                  <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                    <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', color: '#f97316' }} />
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileData.firstname || ''}
                    onChange={handleChange('firstname')}
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '16px', background: 'white' }}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                    <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', color: '#f97316' }} />
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileData.lastname || ''}
                    onChange={handleChange('lastname')}
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '16px', background: 'white' }}
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                    <FontAwesomeIcon icon={faPhone} style={{ marginRight: '8px', color: '#f97316' }} />
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={profileData.contact || ''}
                    onChange={handleChange('contact')}
                    style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '16px', background: 'white' }}
                  />
                </div>

                {/* Email Address (read-only) */}
                <div>
                  <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                    <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: '8px', color: '#f97316' }} />
                    Email Address
                  </label>
                  <div
                    style={{ background: '#f9fafb', color: '#1e293b', padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '16px', fontWeight: '500' }}
                  >
                    {profileData.email || 'Not available'}
                  </div>
                </div>

                {/* Department (read-only) */}
                <div>
                  <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                    <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px', color: '#f97316' }} />
                    Department
                  </label>
                  <div
                    style={{ background: '#f9fafb', color: '#1e293b', padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '16px', fontWeight: '500' }}
                  >
                    {profileData.department || 'Not available'}
                  </div>
                </div>
              </div>
              {/* Save Button */}
              <div style={{ marginTop: '20px', width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, #0f2c63 0%, #f97316 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '700',
                    boxShadow: '0 4px 15px rgba(15, 44, 99, 0.25)'
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InstructorSettings;
