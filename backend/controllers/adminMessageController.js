import AdminMessage from '../models/AdminMessage.js';
import InstructorNotification from '../models/InstructorNotification.js';

// Send a message from admin to instructor and create notification
export const sendMessage = async (req, res) => {
  const { instructorId, adminId, message } = req.body;
  try {
    const newMessage = await AdminMessage.create({
      instructor: instructorId,
      admin: adminId,
      message
    });
    // Create notification for instructor
    await InstructorNotification.create({
      instructor: instructorId,
      type: 'admin_message',
      message: 'You have a new message from admin.',
      referenceId: newMessage._id,
      read: false
    });
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get messages for an instructor
export const getMessagesForInstructor = async (req, res) => {
  const { instructorId } = req.params;
  try {
    const messages = await AdminMessage.find({ instructor: instructorId }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark a message as read
export const markMessageRead = async (req, res) => {
  const { messageId } = req.params;
  try {
    const message = await AdminMessage.findByIdAndUpdate(messageId, { read: true }, { new: true });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
