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
    
    // Ensure salary has proper structure
    if (!req.body.salary) {
      req.body.salary = {
        amount: 0,
        currency: 'KSh',
        paymentFrequency: 'Monthly'
      };
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

// ========== FIXED PAYROLL ENDPOINTS ==========

// Mark teacher as paid for specific month/year
router.post('/:id/mark-paid', auth, adminAuth, async (req, res) => {
  try {
    const { month, year, amount, notes } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Month and year are required' 
      });
    }
    
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    // Use the model method
    await teacher.markAsPaid(
      year, 
      month, 
      amount, 
      notes || `Salary payment for ${month} ${year}`,
      req.user?.name || 'Admin'
    );
    
    res.json({
      success: true,
      message: `Teacher marked as paid for ${month} ${year}`,
      teacher: teacher
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get teacher payment status for specific month
router.get('/:id/payment-status/:year/:month', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    const status = teacher.getPaymentStatus(
      parseInt(req.params.year),
      req.params.month
    );
    
    res.json({
      success: true,
      paymentStatus: status,
      teacher: {
        name: `${teacher.firstName} ${teacher.lastName}`,
        salary: teacher.salary,
        isActive: teacher.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get teacher payment history
router.get('/:id/payment-history', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    res.json({
      success: true,
      paymentHistory: teacher.monthlyPayments.sort((a, b) => {
        // Sort by year and month
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return b.year - a.year || months.indexOf(b.month) - months.indexOf(a.month);
      }),
      salary: teacher.salary
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk mark teachers as paid for specific month
router.post('/bulk/mark-paid', auth, adminAuth, async (req, res) => {
  try {
    const { teacherIds, month, year, notes } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Month and year are required' 
      });
    }
    
    if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'teacherIds array is required' 
      });
    }
    
    const teachers = await Teacher.find({ _id: { $in: teacherIds } });
    
    // Mark each teacher as paid
    const updatePromises = teachers.map(teacher => 
      teacher.markAsPaid(
        year, 
        month, 
        teacher.salary.amount, 
        notes || `Bulk salary payment for ${month} ${year}`,
        req.user?.name || 'Admin'
      )
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: `${teachers.length} teachers marked as paid for ${month} ${year}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get payroll summary for specific month
router.get('/payroll/summary/:year/:month', auth, async (req, res) => {
  try {
    const { year, month } = req.params;
    const teachers = await Teacher.find({ isActive: true });
    
    let paidTeachers = 0;
    let unpaidTeachers = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;
    
    teachers.forEach(teacher => {
      const status = teacher.getPaymentStatus(parseInt(year), month);
      const salaryAmount = teacher.salary?.amount || 0;
      
      if (status.status === 'Paid') {
        paidTeachers++;
        paidAmount += status.amount || salaryAmount;
      } else {
        unpaidTeachers++;
        unpaidAmount += salaryAmount;
      }
    });
    
    const summary = {
      month: `${month} ${year}`,
      totalTeachers: teachers.length,
      paidTeachers: paidTeachers,
      unpaidTeachers: unpaidTeachers,
      totalMonthlySalary: paidAmount + unpaidAmount,
      paidAmount: paidAmount,
      unpaidAmount: unpaidAmount,
      teachers: teachers.map(teacher => ({
        id: teacher._id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        salary: teacher.salary?.amount || 0,
        status: teacher.getPaymentStatus(parseInt(year), month).status,
        paidAmount: teacher.getPaymentStatus(parseInt(year), month).amount || 0
      }))
    };
    
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;