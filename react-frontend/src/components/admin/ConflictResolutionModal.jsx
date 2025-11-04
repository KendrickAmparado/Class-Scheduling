import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faTimes, faUser, faDoorOpen, faUsers } from '@fortawesome/free-solid-svg-icons';

const ConflictResolutionModal = ({ show, conflicts, scheduleData, onProceed, onCancel, onModify }) => {
  if (!show) return null;

  const hasConflicts = conflicts && (
    (conflicts.instructor && conflicts.instructor.length > 0) ||
    (conflicts.room && conflicts.room.length > 0) ||
    (conflicts.section && conflicts.section.length > 0)
  );

  if (!hasConflicts) return null;

  return (
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
      onClick={onCancel}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '600px',
          width: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: 24, color: '#f59e0b' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1f2937' }}>
                Schedule Conflicts Detected
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#6b7280' }}>
                The following conflicts were found:
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
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

        <div style={{ marginBottom: '24px' }}>
          {/* Instructor Conflicts */}
          {conflicts.instructor && conflicts.instructor.length > 0 && (
            <div style={{ marginBottom: '20px', padding: '16px', background: '#fef2f2', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px' }}>
                <FontAwesomeIcon icon={faUser} style={{ color: '#ef4444', fontSize: 18 }} />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#991b1b' }}>
                  Instructor Conflict ({conflicts.instructor.length})
                </h4>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#7f1d1d' }}>
                {scheduleData?.instructor} is already scheduled at this time:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {conflicts.instructor.map((conflict, idx) => (
                  <div key={idx} style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', fontSize: 13 }}>
                    <strong>{conflict.subject}</strong> - {conflict.section} on {conflict.day} at {conflict.time}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room Conflicts */}
          {conflicts.room && conflicts.room.length > 0 && (
            <div style={{ marginBottom: '20px', padding: '16px', background: '#fef2f2', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px' }}>
                <FontAwesomeIcon icon={faDoorOpen} style={{ color: '#ef4444', fontSize: 18 }} />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#991b1b' }}>
                  Room Conflict ({conflicts.room.length})
                </h4>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#7f1d1d' }}>
                Room {scheduleData?.room} is already occupied at this time:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {conflicts.room.map((conflict, idx) => (
                  <div key={idx} style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', fontSize: 13 }}>
                    <strong>{conflict.subject}</strong> - {conflict.section} by {conflict.instructor} on {conflict.day} at {conflict.time}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Conflicts */}
          {conflicts.section && conflicts.section.length > 0 && (
            <div style={{ marginBottom: '20px', padding: '16px', background: '#fef2f2', borderRadius: '12px', borderLeft: '4px solid #ef4444' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px' }}>
                <FontAwesomeIcon icon={faUsers} style={{ color: '#ef4444', fontSize: 18 }} />
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#991b1b' }}>
                  Section Conflict ({conflicts.section.length})
                </h4>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#7f1d1d' }}>
                This section already has a class scheduled at this time:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {conflicts.section.map((conflict, idx) => (
                  <div key={idx} style={{ padding: '10px', background: '#ffffff', borderRadius: '8px', fontSize: 13 }}>
                    <strong>{conflict.subject}</strong> by {conflict.instructor} in {conflict.room} on {conflict.day} at {conflict.time}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              background: '#ffffff',
              color: '#374151',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onModify}
            style={{
              padding: '10px 20px',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              background: '#ffffff',
              color: '#3b82f6',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#eff6ff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#ffffff';
            }}
          >
            Modify Schedule
          </button>
          <button
            onClick={onProceed}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: '#f59e0b',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionModal;

