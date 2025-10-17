import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../../styles/SchedulePopup.css';

const SchedulePopup = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    course: '',
    year: '',
    section: '',
    subject: '',
    instructor: '',
    day: '',
    time: '',
    room: ''
  });

  const courses = ['BSIT', 'BSEMC-DAT'];
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const sections = ['A', 'B', 'C', 'D', 'E', 'F'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const times = [
    '7:30 - 8:30', '8:30 - 9:30', '9:30 - 10:30', '10:30 - 11:30',
    '11:30 - 12:30', '1:30 - 2:30', '2:30 - 3:30', '3:30 - 4:30',
    '4:30 - 5:30', '5:30 - 6:30', '6:30 - 7:30', '7:30 - 8:30', '8:30 - 9:00'
  ];
  const rooms = ['ComLab 1', 'ComLab 2', 'ComLab 3', 'ComLab 4', 'ComLab 5', 'ComLab 6', 'ComLab 7', 'ComLab 8', 'ComLab 9', 'ComLab 10', 'ComLab 11', 'ComLab 12'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="popup-overlay" style={{ display: 'flex' }}>
      <div className="popup-content">
        <div className="popup-header">
          <h3>
            <FontAwesomeIcon icon={faCalendarPlus} />
            Create New Schedule
          </h3>
          <button className="popup-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <form className="schedule-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Course</label>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Year Level</label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
              >
                <option value="">Select Year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Section</label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                required
              >
                <option value="">Select Section</option>
                {sections.map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Enter subject name"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Instructor</label>
            <input
              type="text"
              name="instructor"
              value={formData.instructor}
              onChange={handleChange}
              placeholder="Enter instructor name"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Day</label>
              <select
                name="day"
                value={formData.day}
                onChange={handleChange}
                required
              >
                <option value="">Select Day</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Time</label>
              <select
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
              >
                <option value="">Select Time</option>
                {times.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Room</label>
              <select
                name="room"
                value={formData.room}
                onChange={handleChange}
                required
              >
                <option value="">Select Room</option>
                {rooms.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Create Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchedulePopup;