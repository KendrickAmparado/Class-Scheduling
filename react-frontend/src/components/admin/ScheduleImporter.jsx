import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faFileImport, faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx-js-style';
import { useToast } from '../common/ToastProvider.jsx';
import apiClient from '../../services/apiClient.js';

const ScheduleImporter = ({ show, onClose, course, year, sectionName, onImportComplete }) => {
  const { showToast } = useToast();
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);

  if (!show) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview([]);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Validate and parse data
        const parsed = [];
        const errs = [];

        jsonData.forEach((row, index) => {
          const rowNum = index + 2; // +2 because index starts at 0 and we have header
          
          // Expected columns: Subject, Instructor, Day, Time, Room
          const subject = row['Subject'] || row['subject'] || row['SUBJECT'];
          const instructor = row['Instructor'] || row['instructor'] || row['INSTRUCTOR'];
          const day = row['Day'] || row['day'] || row['DAY'];
          const time = row['Time'] || row['time'] || row['TIME'];
          const room = row['Room'] || row['room'] || row['ROOM'];

          if (!subject || !instructor || !day || !time || !room) {
            errs.push(`Row ${rowNum}: Missing required fields (Subject, Instructor, Day, Time, Room)`);
            return;
          }

          parsed.push({
            subject: String(subject).trim(),
            instructor: String(instructor).trim(),
            day: String(day).trim(),
            time: String(time).trim(),
            room: String(room).trim(),
            rowNum,
          });
        });

        if (parsed.length === 0) {
          setErrors(['No valid schedule data found in file.']);
        } else {
          setPreview(parsed);
        }

        if (errs.length > 0) {
          setErrors(errs);
        }
      } catch (error) {
        setErrors([`Error reading file: ${error.message}`]);
        console.error('File read error:', error);
      }
    };

    if (selectedFile.name.endsWith('.csv')) {
      reader.readAsText(selectedFile);
    } else {
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      showToast('No valid schedules to import.', 'error');
      return;
                const res = await apiClient.createSchedule({
                  course,
                  year,
                  section: sectionName,
                  subject: schedule.subject,
                  instructor: schedule.instructor,
                  day: schedule.day,
                  time: schedule.time,
                  room: schedule.room,
                });
                const data = res.data;
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              course,
              year,
              section: sectionName,
              subject: schedule.subject,
              instructor: schedule.instructor,
              day: schedule.day,
              time: schedule.time,
              room: schedule.room,
            }),
          });

          const data = await response.json();
          if (data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`Error importing row ${schedule.rowNum}:`, error);
        }
      }

      if (successCount > 0) {
        showToast(`Successfully imported ${successCount} schedule(s)${errorCount > 0 ? `. ${errorCount} failed.` : '.'}`, 'success');
        if (onImportComplete) {
          onImportComplete();
        }
        handleClose();
      } else {
        showToast('Failed to import any schedules.', 'error');
      }
    } catch (error) {
      showToast('Error during import process.', 'error');
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    onClose();
  };

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
      onClick={handleClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '800px',
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
              Import Schedules from File
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#6b7280' }}>
              Upload CSV or Excel file to import schedules
            </p>
          </div>
          <button
            onClick={handleClose}
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

        {/* File Format Instructions */}
        <div style={{
          background: '#f0f9ff',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '2px solid #bae6fd',
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#0369a1' }}>
            File Format Requirements:
          </h4>
          <p style={{ margin: 0, fontSize: 13, color: '#075985', lineHeight: 1.6 }}>
            Your file must include these columns: <strong>Subject</strong>, <strong>Instructor</strong>, <strong>Day</strong>, <strong>Time</strong>, <strong>Room</strong>
            <br />
            Time format: <strong>"8:00 AM - 9:30 AM"</strong> or similar
            <br />
            Supported formats: <strong>.csv, .xlsx, .xls</strong>
          </p>
        </div>

        {/* File Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            border: '2px dashed #d1d5db',
            borderRadius: '12px',
            cursor: 'pointer',
            background: file ? '#f0fdf4' : '#f9fafb',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!file) e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.background = file ? '#f0fdf4' : '#eff6ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d1d5db';
            e.currentTarget.style.background = file ? '#f0fdf4' : '#f9fafb';
          }}
          >
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload" style={{ cursor: 'pointer', textAlign: 'center' }}>
              <FontAwesomeIcon icon={faFileImport} style={{ fontSize: 48, color: file ? '#10b981' : '#6b7280', marginBottom: '12px' }} />
              <p style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
                {file ? file.name : 'Click to select file'}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                CSV or Excel files only
              </p>
            </label>
          </label>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div style={{
            background: '#fef2f2',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            borderLeft: '4px solid #ef4444',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px' }}>
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#ef4444', fontSize: 18 }} />
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#991b1b' }}>
                Validation Errors ({errors.length})
              </h4>
            </div>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {errors.map((error, idx) => (
                <p key={idx} style={{ margin: '4px 0', fontSize: 12, color: '#7f1d1d' }}>
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px' }}>
              <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#10b981', fontSize: 18 }} />
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#065f46' }}>
                Preview ({preview.length} schedule(s))
              </h4>
            </div>
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>Subject</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>Instructor</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>Day</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>Time</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600 }}>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((schedule, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px' }}>{schedule.subject}</td>
                      <td style={{ padding: '10px' }}>{schedule.instructor}</td>
                      <td style={{ padding: '10px' }}>{schedule.day}</td>
                      <td style={{ padding: '10px' }}>{schedule.time}</td>
                      <td style={{ padding: '10px' }}>{schedule.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={handleClose}
            disabled={importing}
            style={{
              padding: '10px 20px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              background: '#ffffff',
              color: '#374151',
              fontWeight: 600,
              cursor: importing ? 'not-allowed' : 'pointer',
              fontSize: 14,
              opacity: importing ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={preview.length === 0 || importing || !sectionName}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: preview.length === 0 || importing || !sectionName
                ? '#9ca3af'
                : 'linear-gradient(135deg, #0f2c63 0%, #f97316 100%)',
              color: '#ffffff',
              fontWeight: 600,
              cursor: preview.length === 0 || importing || !sectionName ? 'not-allowed' : 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FontAwesomeIcon icon={faFileImport} />
            {importing ? 'Importing...' : `Import ${preview.length} Schedule(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleImporter;

