import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGear,
  faClipboardList,
  faDownload,
  faSpinner,
  faTimes,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import axios from 'axios';
import { useToast } from '../common/ToastProvider.jsx';

const AdminSettings = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showBackupKeyModal, setShowBackupKeyModal] = useState(false);
  const [backupKey, setBackupKey] = useState('');
  const [showBackupKey, setShowBackupKey] = useState(false);
  const [savedBackupKey, setSavedBackupKey] = useState('');
  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  // Load backup key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('admin_backup_key');
    if (stored) {
      setSavedBackupKey(stored);
    }
  }, []);

  const settingsOptions = [
    {
      id: 'activity-logs',
      title: 'Activity Logs',
      description: 'View and manage system activity logs, user actions, and audit trails',
      icon: faClipboardList,
      color: '#0f2c63',
      bgGradient: 'linear-gradient(135deg, #0f2c63 0%, #1e40af 100%)',
      action: () => navigate('/admin/activity-logs'),
    },
    {
      id: 'backup-data',
      title: 'Backup Data',
      description: 'Export and backup all system data including schedules, users, and settings',
      icon: faDownload,
      color: '#f97316',
      bgGradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
      action: () => handleBackupData(),
    },
  ];

  const handleSaveBackupKey = () => {
    if (!backupKey.trim()) {
      showToast('❌ Please enter a backup key', 'error');
      return;
    }
    localStorage.setItem('admin_backup_key', backupKey);
    setSavedBackupKey(backupKey);
    setBackupKey('');
    setShowBackupKeyModal(false);
    showToast('✅ Backup key saved securely!', 'success');
  };

  const handleClearBackupKey = () => {
    localStorage.removeItem('admin_backup_key');
    setSavedBackupKey('');
    showToast('🗑️ Backup key cleared', 'info');
  };

  const handleBackupData = async () => {
    if (isBackingUp) return;
    
    if (!savedBackupKey) {
      showToast('⚠️ Backup key required. Please set one in settings.', 'warning');
      setShowBackupKeyModal(true);
      return;
    }
    
    try {
      setIsBackingUp(true);
      showToast('Preparing backup...', 'info');
      
      const response = await axios.get(`${apiBase}/api/admin/backup`, {
        responseType: 'blob',
        headers: {
          'x-admin-backup-key': savedBackupKey,
        },
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      link.setAttribute('download', `class-scheduling-backup-${timestamp}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('✅ Backup downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error backing up data:', error);
      if (error.response?.status === 403) {
        showToast('❌ Invalid backup key. Please check your credentials.', 'error');
      } else {
        showToast('❌ Failed to backup data. Please try again.', 'error');
      }
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'linear-gradient(135deg, #0f2c63 0%, #1e3a72 20%, #2d4a81 40%, #ea580c 70%, #f97316 100%)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          marginLeft: 0,
        }}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <div style={{ padding: '40px', marginTop: '100px', flex: 1 }}>
          {/* Page Header */}
          <div style={{ marginBottom: '50px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}>
              <FontAwesomeIcon
                icon={faGear}
                style={{ fontSize: '40px', color: '#f97316' }}
              />
              <h1 style={{ margin: 0, color: '#ffffff', fontSize: '36px', fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                System Settings
              </h1>
            </div>
            <p style={{ margin: '0', color: 'rgba(255,255,255,0.9)', fontSize: '16px', marginTop: '10px' }}>
              Manage system configuration, backups, and maintenance
            </p>
          </div>

          {/* Settings Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '32px',
              marginBottom: '50px',
              maxWidth: '1000px',
              margin: '0 auto 50px',
            }}
          >
            {settingsOptions.map((option) => (
              <div
                key={option.id}
                onClick={option.id === 'backup-data' && isBackingUp ? undefined : option.action}
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  cursor: isBackingUp && option.id === 'backup-data' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  opacity: isBackingUp && option.id === 'backup-data' ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!(isBackingUp && option.id === 'backup-data')) {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(15, 44, 99, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
                }}
              >
                {/* Top Color Bar */}
                <div
                  style={{
                    height: '6px',
                    background: option.bgGradient,
                  }}
                />

                {/* Content */}
                <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '16px',
                      background: `${option.color}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      color: option.color,
                    }}
                  >
                    <FontAwesomeIcon 
                      icon={isBackingUp && option.id === 'backup-data' ? faSpinner : option.icon}
                      style={{ animation: isBackingUp && option.id === 'backup-data' ? 'spin 1s linear infinite' : 'none' }}
                    />
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      margin: '0',
                      color: '#0f172a',
                      fontSize: '22px',
                      fontWeight: '700',
                    }}
                  >
                    {option.title}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      margin: '0',
                      color: '#64748b',
                      fontSize: '15px',
                      lineHeight: '1.6',
                      flex: 1,
                    }}
                  >
                    {option.description}
                  </p>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!(isBackingUp && option.id === 'backup-data')) {
                        option.action();
                      }
                    }}
                    disabled={isBackingUp && option.id === 'backup-data'}
                    style={{
                      background: option.bgGradient,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px 24px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: isBackingUp && option.id === 'backup-data' ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: isBackingUp && option.id === 'backup-data' ? 0.8 : 1,
                      transform: isBackingUp && option.id === 'backup-data' ? 'scale(0.98)' : 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      if (!(isBackingUp && option.id === 'backup-data')) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <FontAwesomeIcon 
                      icon={isBackingUp && option.id === 'backup-data' ? faSpinner : option.icon}
                      style={{ animation: isBackingUp && option.id === 'backup-data' ? 'spin 1s linear infinite' : 'none' }}
                    />
                    {isBackingUp && option.id === 'backup-data' ? 'Preparing...' : option.id === 'activity-logs' ? 'View Logs' : 'Download Backup'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Info Section */}
          <div style={{ maxWidth: '1000px', margin: '0 auto', marginTop: '50px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '30px',
              color: 'rgba(255, 255, 255, 0.95)',
            }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: '700' }}>📋 System Information</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', fontSize: '14px' }}>
                <li>Regular backups help protect your data from loss or corruption</li>
                <li>Activity logs track all system changes and user actions for audit purposes</li>
                <li>Backups include all schedules, instructors, rooms, sections, and settings</li>
                <li>Downloaded backups are stored as ZIP files for safe archiving</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Backup Key Modal */}
      {showBackupKeyModal && (
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
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.3s ease-out',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px',
            }}>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: '700' }}>
                🔐 Backup Authentication
              </h2>
              <button
                onClick={() => setShowBackupKeyModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0,
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Description */}
            <p style={{
              color: '#64748b',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '25px',
            }}>
              Enter the admin backup key to authenticate and download system backups. This key is stored securely in your browser's local storage.
            </p>

            {/* Key Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#0f172a',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
              }}>
                Backup Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showBackupKey ? 'text' : 'password'}
                  value={backupKey}
                  onChange={(e) => setBackupKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveBackupKey();
                    }
                  }}
                  placeholder="Enter backup key..."
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.3s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#f97316'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                <button
                  onClick={() => setShowBackupKey(!showBackupKey)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    fontSize: '16px',
                    padding: '4px 8px',
                  }}
                >
                  <FontAwesomeIcon icon={showBackupKey ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {/* Current Key Status */}
            {savedBackupKey && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '25px',
                fontSize: '13px',
                color: '#166534',
              }}>
                ✅ Backup key is currently saved. (Last 4 chars: ...{savedBackupKey.slice(-4)})
              </div>
            )}

            {/* Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}>
              <button
                onClick={() => setShowBackupKeyModal(false)}
                style={{
                  padding: '12px 24px',
                  border: '2px solid #e2e8f0',
                  background: '#ffffff',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#64748b',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBackupKey}
                disabled={!backupKey.trim()}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: backupKey.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  opacity: backupKey.trim() ? 1 : 0.5,
                }}
                onMouseEnter={(e) => {
                  if (backupKey.trim()) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Save Key
              </button>
            </div>

            {/* Clear Key Button */}
            {savedBackupKey && (
              <button
                onClick={handleClearBackupKey}
                style={{
                  width: '100%',
                  marginTop: '15px',
                  padding: '10px 16px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
              >
                Clear Saved Key
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 1024px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
          }
        }

        @media (max-width: 768px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;
