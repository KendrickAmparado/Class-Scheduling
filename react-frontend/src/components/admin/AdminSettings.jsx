import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faGear,
  faClipboardList,
  faDownload,
} from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../common/Sidebar.jsx';
import Header from '../common/Header.jsx';
import axios from 'axios';
import { useToast } from '../common/ToastProvider.jsx';
import '../../styles/Settings.css';

const AdminSettings = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  const settingsOptions = [
    {
      id: 'activity-logs',
      title: 'Activity Logs',
      description: 'View and manage system activity logs, user actions, and audit trails',
      icon: faClipboardList,
      color: '#0f2c63',
      action: () => navigate('/admin/activity-logs'),
    },
    {
      id: 'backup-data',
      title: 'Backup Data',
      description: 'Export and backup all system data including schedules, users, and settings',
      icon: faDownload,
      color: '#f97316',
      action: () => handleBackupData(),
    },
  ];

  const handleBackupData = async () => {
    try {
      const response = await axios.get(`${apiBase}/api/admin/backup`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      showToast('Backup downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error backing up data:', error);
      showToast('Failed to backup data. Please try again.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'transparent' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          marginLeft: 0,
          background: 'transparent',
        }}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <div style={{ padding: '24px 40px', marginTop: '90px', flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {/* Back Button */}
          <button
            onClick={() => navigate('/admin/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              color: '#374151',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '20px',
              fontSize: '15px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Dashboard</span>
          </button>

          {/* Page Header */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <FontAwesomeIcon
                icon={faGear}
                style={{ fontSize: '32px', color: '#0f2c63' }}
              />
              <h1 style={{ margin: 0, color: '#0f2c63', fontSize: '32px', fontWeight: '700' }}>
                System Settings
              </h1>
            </div>
            <p style={{ margin: '0', color: '#64748b', fontSize: '16px' }}>
              Manage system configuration, backups, and maintenance
            </p>
          </div>

          {/* Settings Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '24px',
              marginBottom: '40px',
              maxWidth: '800px',
            }}
          >
            {settingsOptions.map((option) => (
              <div
                key={option.id}
                onClick={option.action}
                style={{
                  background: '#ffffff',
                  border: `2px solid #e5e7eb`,
                  borderRadius: '16px',
                  padding: '28px 24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(15, 44, 99, 0.15)';
                  e.currentTarget.style.borderColor = option.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                {/* Icon Background */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-20px',
                    right: '-20px',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: `${option.color}15`,
                    zIndex: 0,
                  }}
                />

                {/* Icon */}
                <div
                  style={{
                    fontSize: '32px',
                    color: option.color,
                    position: 'relative',
                    zIndex: 1,
                    width: 'fit-content',
                  }}
                >
                  <FontAwesomeIcon icon={option.icon} />
                </div>

                {/* Title */}
                <h3
                  style={{
                    margin: '0',
                    color: '#0f172a',
                    fontSize: '18px',
                    fontWeight: '700',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {option.title}
                </h3>

                {/* Description */}
                <p
                  style={{
                    margin: '0',
                    color: '#64748b',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {option.description}
                </p>

                {/* Arrow Indicator */}
                <div
                  style={{
                    marginTop: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    color: option.color,
                    fontSize: '14px',
                    fontWeight: '600',
                    position: 'relative',
                    zIndex: 1,
                    opacity: 0,
                    transform: 'translateX(-10px)',
                    transition: 'all 0.3s ease',
                  }}
                  className="settings-arrow"
                >
                  Open →
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{`
        .settings-arrow {
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s ease;
        }

        div:has(.settings-arrow):hover .settings-arrow {
          opacity: 1;
          transform: translateX(0);
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
