import express from 'express';
import { sendMessage, getMessagesForInstructor, markMessageRead } from '../controllers/adminMessageController.js';

const router = express.Router();

// Send a message from admin to instructor
router.post('/send', sendMessage);

// Get messages for an instructor
router.get('/instructor/:instructorId', getMessagesForInstructor);

// Mark a message as read
router.patch('/read/:messageId', markMessageRead);

export default router;
