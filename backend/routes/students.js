const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// GET all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find().sort({ admissionNumber: 1 });
    res.json({
      success: true,
      count: students.length,
      students: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
});

// GET single student by admission number (using query parameter - BETTER APPROACH)
router.get('/by-admission', async (req, res) => {
  try {
    const { admissionNumber } = req.query;
    
    console.log('Searching for:', admissionNumber);
    
    const student = await Student.findOne({ admissionNumber: admissionNumber });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student not found: ${admissionNumber}`
      });
    }
    
    res.json({
      success: true,
      student: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student',
      error: error.message
    });
  }
});

// POST - Add a new student
router.post('/', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json({ 
      success: true, 
      message: 'Student added successfully!',
      student: student 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Error adding student',
      error: error.message 
    });
  }
});

// PUT - Update a student
router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    res.json({
      success: true,
      message: 'Student updated successfully!',
      student: student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating student',
      error: error.message
    });
  }
});

// DELETE - Remove a student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student deleted successfully!',
      deletedStudent: student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deleting student',
      error: error.message
    });
  }
});

module.exports = router;