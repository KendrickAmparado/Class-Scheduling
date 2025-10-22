import express from 'express';
import Room from '../models/Room.js'; // Adjust path as needed

const router = express.Router();

// GET /api/rooms - get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({});
    res.json({ rooms });
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ message: 'Server error fetching rooms' });
  }
});

// POST /api/rooms - add a new room
router.post('/', async (req, res) => {
  try {
    const { room: roomName, area, status } = req.body;

    if (!roomName || !area) {
      return res.status(400).json({ success: false, message: 'Room name and area are required.' });
    }

    const newRoom = new Room({
      room: roomName,
      area,
      status: status || 'available'  // default status
    });

    await newRoom.save();

    res.status(201).json({ success: true, message: 'Room added successfully', room: newRoom });
  } catch (err) {
    console.error('Error adding room:', err);
    res.status(500).json({ success: false, message: 'Server error while adding room' });
  }
});

// PUT /api/rooms/:id - update room details
router.put('/:id', async (req, res) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRoom) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    res.json({ success: true, room: updatedRoom });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ success: false, message: 'Server error while updating room.' });
  }
  
});
router.delete('/:id', async (req, res) => {
  try {
    const deletedRoom = await Room.findByIdAndDelete(req.params.id);
    if (!deletedRoom) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    res.json({ success: true, message: 'Room deleted successfully.' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting room.' });
  }
});

export default router;
