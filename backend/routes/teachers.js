const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const { auth, adminAuth } = require('../middleware/authMiddleware');

// GET all teachers - Protected route (requires login)
router.get('/', auth, async (req, res) => {
  try {
    // Get optional status filter from query params
    const status = req.query.status; // 'active', 'inactive', or undefined for all
    
    let query = {};
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    // If status is undefined or 'all', query remains empty (gets all teachers)
    
    const teachers = await Teacher.find(query).sort({ firstName: 1 });
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
    // Ensure additionalGrades is an array (default if not provided)
    if (!req.body.additionalGrades) {
      req.body.additionalGrades = [];
    }
    
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
    // Ensure additionalGrades is an array
    if (req.body.additionalGrades && !Array.isArray(req.body.additionalGrades)) {
      return res.status(400).json({
        success: false,
        message: 'additionalGrades must be an array'
      });
    }
    
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

// DELETE - Permanently delete a teacher - Admin only
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      message: 'Teacher permanently deleted successfully!',
      deletedTeacher: teacher
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deleting teacher',
      error: error.message
    });
  }
});

// GET teachers by grade - Protected route (UPDATED FOR MULTIPLE GRADES)
router.get('/grade/:grade', auth, async (req, res) => {
  try {
    const teachers = await Teacher.find({
      $or: [
        { primaryGradeAssigned: req.params.grade },
        { additionalGrades: req.params.grade }
      ],
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

// NEW: Get all assigned grades for a teacher (helper endpoint)
router.get('/:id/grades', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }
    
    // Combine primary and additional grades
    const allGrades = [teacher.primaryGradeAssigned, ...teacher.additionalGrades];
    
    res.json({
      success: true,
      grades: allGrades
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching teacher grades',
      error: error.message
    });
  }
});

module.exports = router;