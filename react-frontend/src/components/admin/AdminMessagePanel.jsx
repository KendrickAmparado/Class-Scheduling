import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminMessagePanel = () => {
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Fetch instructors for dropdown
    axios.get('/api/instructors')
      .then(res => setInstructors(res.data))
      .catch(() => setInstructors([]));
  }, []);

  const handleSend = async () => {
    if (!selectedInstructor || !message) {
      setStatus('Please select an instructor and enter a message.');
      return;
    }
    try {
      // Replace adminId with actual logged-in admin's ID
      const adminId = 'admin-id-placeholder';
      await axios.post('/api/admin-message/send', {
        instructorId: selectedInstructor,
        adminId,
        message
      });
      setStatus('Message sent successfully!');
      setMessage('');
    } catch (err) {
      setStatus('Failed to send message.');
    }
  };

  return (
    <div className="admin-message-panel">
      <h3>Send Message to Instructor</h3>
      <select value={selectedInstructor} onChange={e => setSelectedInstructor(e.target.value)}>
        <option value="">Select Instructor</option>
        {instructors.map(inst => (
          <option key={inst._id} value={inst._id}>{inst.firstname} {inst.lastname}</option>
        ))}
      </select>
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type your message here..."
        rows={4}
        style={{ width: '100%', marginTop: '10px' }}
      />
      <button onClick={handleSend} style={{ marginTop: '10px' }}>Send Message</button>
      {status && <div style={{ marginTop: '10px', color: status.includes('success') ? 'green' : 'red' }}>{status}</div>}
    </div>
  );
};

export default AdminMessagePanel;
