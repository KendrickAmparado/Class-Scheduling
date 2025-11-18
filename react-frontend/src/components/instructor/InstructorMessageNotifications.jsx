import React, { useEffect, useState } from 'react';
import axios from 'axios';

const InstructorMessageNotifications = ({ instructorId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instructorId) return;
    setLoading(true);
    axios.get(`/api/admin-message/instructor/${instructorId}`)
      .then(res => setMessages(res.data))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [instructorId]);

  const markAsRead = async (messageId) => {
    await axios.patch(`/api/admin-message/read/${messageId}`);
    setMessages(msgs => msgs.map(m => m._id === messageId ? { ...m, read: true } : m));
  };

  if (loading) return <div>Loading messages...</div>;
  if (!messages.length) return <div>No messages from admin.</div>;

  return (
    <div className="instructor-message-notifications">
      <h3>Messages from Admin</h3>
      <ul>
        {messages.map(msg => (
          <li key={msg._id} style={{ marginBottom: '10px', background: msg.read ? '#f0f0f0' : '#fffbe6', padding: '10px', borderRadius: '6px' }}>
            <div><strong>Message:</strong> {msg.message}</div>
            <div><small>{new Date(msg.createdAt).toLocaleString()}</small></div>
            {!msg.read && <button onClick={() => markAsRead(msg._id)}>Mark as read</button>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InstructorMessageNotifications;
