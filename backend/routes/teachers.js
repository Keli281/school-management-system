const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const { auth, adminAuth } = require('../middleware/authMiddleware'); // ADD THIS LINE

// GET all teachers - Protected route (requires login)
router.get('/', auth, async (req, res) => {
  try {
    const teachers = await Teacher.find({ isActive: true }).sort({ firstName: 1 });
    res.json({
      success: true,
      count: teachers.length,
      teachers: teachers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching teachers',
      error: error.message
    });
  }
});

// GET single teacher by ID - Protected route
router.get('/:id', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    res.json({
      success: true,
      teacher: teacher
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher',
      error: error.message
    });
  }
});

// POST - Add a new teacher - Admin only
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const teacher = new Teacher(req.body);
    await teacher.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Teacher added successfully!',
      teacher: teacher 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Error adding teacher',
      error: error.message 
    });
  }
});

// PUT - Update a teacher - Admin only
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Teacher updated successfully!',
      teacher: teacher
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating teacher',
      error: error.message
    });
  }
});

// DELETE - Soft delete a teacher (set isActive to false) - Admin only
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      message: 'Teacher archived successfully!',
      teacher: teacher
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error archiving teacher',
      error: error.message
    });
  }
});

// GET teachers by grade - Protected route
router.get('/grade/:grade', auth, async (req, res) => {
  try {
    const teachers = await Teacher.find({ 
      gradeAssigned: req.params.grade,
      isActive: true 
    }).sort({ firstName: 1 });
    
    res.json({
      success: true,
      count: teachers.length,
      teachers: teachers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching teachers by grade',
      error: error.message
    });
  }
});

module.exports = router;