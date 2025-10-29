import express from 'express';
import Section from '../models/Section.js';
import Schedule from '../models/Schedule.js'; // Import Schedule model
import Alert from '../models/Alert.js';

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

    const alert = await Alert.create({
      type: 'section-created',
      message: `Section ${name} created for ${course} ${year}.`,
      link: '/admin/section-management'
    });
    req.io?.emit('new-alert', alert);

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

// DELETE section by ID (and cascade delete associated schedules)
router.delete('/:id', async (req, res) => {
  try {
    const sectionId = req.params.id;
    
    console.log('Attempting to delete section with ID:', sectionId);
    
    // First, find the section to get its details
    const section = await Section.findById(sectionId);
    
    if (!section) {
      console.log('Section not found:', sectionId);
      return res.status(404).json({ 
        success: false, 
        message: 'Section not found' 
      });
    }
    
    console.log('Found section:', section);
    
    // Delete all schedules associated with this section
    const deleteSchedulesResult = await Schedule.deleteMany({ 
      section: section.name,
      course: section.course,
      year: section.year
    });
    
    console.log('Deleted schedules:', deleteSchedulesResult);
    
    // Delete the section itself
    await Section.findByIdAndDelete(sectionId);
    
    console.log('Section deleted successfully');
    
    // Create alert for section deletion
    const alert = await Alert.create({
      type: 'section-deleted',
      message: `Section ${section.name} deleted from ${section.course} ${section.year}.`,
      link: '/admin/section-management'
    });
    req.io?.emit('new-alert', alert);
    
    res.json({ 
      success: true, 
      message: 'Section and associated schedules deleted successfully',
      deletedSchedules: deleteSchedulesResult.deletedCount
    });
    
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting section',
      error: error.message 
    });
  }
});

export default router;
