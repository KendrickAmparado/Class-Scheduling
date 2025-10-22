import express from 'express';
import Section from '../models/Section.js';

const router = express.Router();

// Create new section
router.post('/create', async (req, res) => {
  const { course, year, name } = req.body;
  if (!course || !year || !name) {
    return res.json({ success: false, message: 'Missing required fields' });
  }
  try {
    const newSection = new Section({ course, year, name });
    await newSection.save();
    res.json({ success: true, section: newSection });
  } catch (error) {
    console.error('Error creating section:', error);
    res.json({ success: false, message: 'Error saving section' });
  }
});

// Get sections filtered by course and year
router.get('/', async (req, res) => {
  const { course, year } = req.query;
  if (!course || !year) {
    return res.json({ success: false, message: 'Missing course or year query' });
  }
  try {
    const sections = await Section.find({ course, year });
    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.json({ success: false, message: 'Error fetching sections' });
  }
});

export default router;
