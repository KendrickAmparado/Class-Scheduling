import express from 'express';
import YearLevel from '../models/yearLevelModel.js';

const router = express.Router();

// GET all year levels
router.get('/', async (req, res) => {
  try {
    const yearLevels = await YearLevel.find({});
    res.json(yearLevels);
  } catch (error) {
    console.error('Error fetching year levels:', error);
    res.status(500).json({ message: 'Server error while fetching year levels' });
  }
});

// Add a new year level
router.post('/', async (req, res) => {
  console.log('Received POST /api/year-levels with:', req.body);

  const { course, subtitle, year } = req.body;
  if (!course || !subtitle || !year) {
    return res.status(400).json({ message: 'All fields (course, subtitle, year) are required.' });
  }
  try {
    const newYearLevel = new YearLevel({ course, subtitle, year });
    const savedYearLevel = await newYearLevel.save();
    console.log('Saved:', savedYearLevel);
    res.status(201).json(savedYearLevel);
  } catch (error) {
    console.error('Error saving year level:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
