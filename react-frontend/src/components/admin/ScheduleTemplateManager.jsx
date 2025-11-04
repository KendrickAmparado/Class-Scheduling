import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave,
  faTrash,
  faTimes,
  faCopy,
  faFileAlt,
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useToast } from '../common/ToastProvider.jsx';
import ConfirmationDialog from '../common/ConfirmationDialog.jsx';

const ScheduleTemplateManager = ({ 
  show, 
  onClose, 
  course, 
  year, 
  currentSchedules = [],
  onApplyTemplate,
  sectionName 
}) => {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null, destructive: false });

  const fetchTemplates = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/schedule-templates?course=${course}&year=${year}`);
      if (res.data.success) {
        setTemplates(res.data.templates || []);
      }
    } catch (error) {
      showToast('Error fetching templates.', 'error');
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }, [course, year, showToast]);

  useEffect(() => {
    if (show) {
      fetchTemplates();
    }
  }, [show, fetchTemplates]);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      showToast('Template name is required.', 'error');
      return;
    }

    if (currentSchedules.length === 0) {
      showToast('No schedules to save as template.', 'error');
      return;
    }

    try {
      const schedules = currentSchedules.map(s => ({
        subject: s.subject,
        instructor: s.instructor,
        instructorEmail: s.instructorEmail || '',
        day: s.day,
        time: s.time,
        room: s.room,
      }));

      const res = await axios.post('http://localhost:5000/api/schedule-templates', {
        name: templateName.trim(),
        description: templateDescription.trim(),
        course,
        year,
        schedules,
      });

      if (res.data.success) {
        showToast('Template saved successfully!', 'success');
        setShowSaveModal(false);
        setTemplateName('');
        setTemplateDescription('');
        fetchTemplates();
      }
    } catch (error) {
      showToast('Error saving template.', 'error');
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = (templateId, templateName) => {
    setConfirmDialog({
      show: true,
      title: 'Delete Template',
      message: `Are you sure you want to delete template "${templateName}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await axios.delete(`http://localhost:5000/api/schedule-templates/${templateId}`);
          if (res.data.success) {
            showToast('Template deleted successfully.', 'success');
            fetchTemplates();
          }
        } catch (error) {
          showToast('Error deleting template.', 'error');
          console.error('Error deleting template:', error);
        }
        setConfirmDialog({ show: false, title: '', message: '', onConfirm: null, destructive: false });
      },
      destructive: true,
    });
  };

  const handleApplyTemplate = (template) => {
    if (onApplyTemplate) {
      onApplyTemplate(template);
      onClose();
    }
  };

  if (!show) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            maxWidth: '700px',
            width: '90vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1f2937' }}>
                Schedule Templates
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#6b7280' }}>
                Save or apply schedule templates for {course?.toUpperCase()} {year}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 24,
                color: '#6b7280',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => setShowSaveModal(true)}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #0f2c63 0%, #f97316 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <FontAwesomeIcon icon={faSave} />
              Save Current as Template
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '2px dashed #d1d5db',
            }}>
              <FontAwesomeIcon icon={faFileAlt} style={{ fontSize: 48, color: '#d1d5db', marginBottom: '16px' }} />
              <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                No templates found. Save your current schedule as a template to get started.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {templates.map((template) => (
                <div
                  key={template._id}
                  style={{
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
                        {template.name}
                      </h4>
                      {template.description && (
                        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                          {template.description}
                        </p>
                      )}
                      <p style={{ margin: '8px 0 0 0', fontSize: 12, color: '#9ca3af' }}>
                        {template.schedules?.length || 0} schedule(s)
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleApplyTemplate(template)}
                        style={{
                          padding: '8px 16px',
                          background: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <FontAwesomeIcon icon={faCopy} />
                        Apply
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template._id, template.name)}
                        style={{
                          padding: '8px 16px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: 13,
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
          }}
          onClick={() => setShowSaveModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '500px',
              width: '90vw',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 700, color: '#1f2937' }}>
              Save Template
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                Template Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., BSIT 1st Year - Morning Schedule"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: 14,
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
                Description (optional)
              </label>
              <textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Brief description of this template..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setTemplateName('');
                  setTemplateDescription('');
                }}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#374151',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0f2c63 0%, #f97316 100%)',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Save Template
              </button>
            </div>
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

export default ScheduleTemplateManager;
