const express = require('express');
const router = express.Router();
const NonTeachingStaff = require('../models/NonTeachingStaff');
const { auth, adminAuth } = require('../middleware/authMiddleware');

// GET all non-teaching staff - Protected route
router.get('/', auth, async (req, res) => {
  try {
    const status = req.query.status;
    const role = req.query.role;
    
    let query = {};
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    if (role) {
      query.role = role;
    }
    
    const staff = await NonTeachingStaff.find(query).sort({ firstName: 1 });
    res.json({
      success: true,
      count: staff.length,
      staff: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching non-teaching staff',
      error: error.message
    });
  }
});

// GET single non-teaching staff by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const staff = await NonTeachingStaff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      staff: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching staff member',
      error: error.message
    });
  }
});

// POST - Add a new non-teaching staff
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const staff = new NonTeachingStaff(req.body);
    await staff.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Staff member added successfully!',
      staff: staff 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Error adding staff member',
      error: error.message 
    });
  }
});

// PUT - Update a non-teaching staff
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const staff = await NonTeachingStaff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Staff member updated successfully!',
      staff: staff
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating staff member',
      error: error.message
    });
  }
});

// DELETE - Permanently delete a non-teaching staff
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const staff = await NonTeachingStaff.findByIdAndDelete(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff member permanently deleted successfully!',
      deletedStaff: staff
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deleting staff member',
      error: error.message
    });
  }
});

// GET staff by role
router.get('/role/:role', auth, async (req, res) => {
  try {
    const staff = await NonTeachingStaff.find({
      role: req.params.role,
      isActive: true
    }).sort({ firstName: 1 });
    
    res.json({
      success: true,
      count: staff.length,
      staff: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching staff by role',
      error: error.message
    });
  }
});

// GET staff statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalStaff = await NonTeachingStaff.countDocuments();
    const activeStaff = await NonTeachingStaff.countDocuments({ isActive: true });
    const inactiveStaff = await NonTeachingStaff.countDocuments({ isActive: false });
    
    const roles = ['Driver', 'Gardener', 'Cleaner', 'Cook', 'Security', 'Other'];
    const roleCounts = {};
    
    for (const role of roles) {
      const count = await NonTeachingStaff.countDocuments({ role, isActive: true });
      roleCounts[role] = count;
    }
    
    const activeStaffList = await NonTeachingStaff.find({ isActive: true });
    const totalMonthlySalary = activeStaffList.reduce((total, staff) => {
      if (staff.salary.paymentFrequency === 'Monthly') {
        return total + (staff.salary.amount || 0);
      }
      return total;
    }, 0);
    
    res.json({
      success: true,
      stats: {
        total: totalStaff,
        active: activeStaff,
        inactive: inactiveStaff,
        byRole: roleCounts,
        totalMonthlySalary: totalMonthlySalary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching staff statistics',
      error: error.message
    });
  }
});

// ========== UPDATED PAYROLL ENDPOINTS ==========

// Mark staff as paid for specific month/year
router.post('/:id/mark-paid', auth, adminAuth, async (req, res) => {
  try {
    const { month, year, amount, notes } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Month and year are required' 
      });
    }
    
    const staff = await NonTeachingStaff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    // Use the model method
    await staff.markAsPaid(
      year, 
      month, 
      amount, 
      notes || `Salary payment for ${month} ${year}`,
      req.user?.name || 'Admin'
    );
    
    res.json({
      success: true,
      message: `Staff marked as paid for ${month} ${year}`,
      staff: staff
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get staff payment status for specific month
router.get('/:id/payment-status/:year/:month', auth, async (req, res) => {
  try {
    const staff = await NonTeachingStaff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    const status = staff.getPaymentStatus(
      parseInt(req.params.year),
      req.params.month
    );
    
    res.json({
      success: true,
      paymentStatus: status,
      staff: {
        name: `${staff.firstName} ${staff.lastName}`,
        salary: staff.salary,
        isActive: staff.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get staff payment history
router.get('/:id/payment-history', auth, async (req, res) => {
  try {
    const staff = await NonTeachingStaff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }
    
    res.json({
      success: true,
      paymentHistory: staff.monthlyPayments.sort((a, b) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return b.year - a.year || months.indexOf(b.month) - months.indexOf(a.month);
      }),
      salary: staff.salary
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk mark staff as paid for specific month
router.post('/bulk/mark-paid', auth, adminAuth, async (req, res) => {
  try {
    const { staffIds, month, year, notes } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Month and year are required' 
      });
    }
    
    if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'staffIds array is required' 
      });
    }
    
    const staffList = await NonTeachingStaff.find({ _id: { $in: staffIds } });
    
    // Mark each staff as paid
    const updatePromises = staffList.map(staff => 
      staff.markAsPaid(
        year, 
        month, 
        staff.salary.amount, 
        notes || `Bulk salary payment for ${month} ${year}`,
        req.user?.name || 'Admin'
      )
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: `${staffList.length} staff members marked as paid for ${month} ${year}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get payroll summary for specific month
router.get('/payroll/summary/:year/:month', auth, async (req, res) => {
  try {
    const { year, month } = req.params;
    const staff = await NonTeachingStaff.find({ isActive: true });
    
    let paidStaff = 0;
    let unpaidStaff = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;
    
    staff.forEach(staffMember => {
      const status = staffMember.getPaymentStatus(parseInt(year), month);
      const salaryAmount = staffMember.salary?.amount || 0;
      
      if (status.status === 'Paid') {
        paidStaff++;
        paidAmount += status.amount || salaryAmount;
      } else {
        unpaidStaff++;
        unpaidAmount += salaryAmount;
      }
    });
    
    const summary = {
      month: `${month} ${year}`,
      totalStaff: staff.length,
      paidStaff: paidStaff,
      unpaidStaff: unpaidStaff,
      totalMonthlySalary: paidAmount + unpaidAmount,
      paidAmount: paidAmount,
      unpaidAmount: unpaidAmount,
      staff: staff.map(staffMember => ({
        id: staffMember._id,
        name: `${staffMember.firstName} ${staffMember.lastName}`,
        salary: staffMember.salary?.amount || 0,
        status: staffMember.getPaymentStatus(parseInt(year), month).status,
        paidAmount: staffMember.getPaymentStatus(parseInt(year), month).amount || 0
      }))
    };
    
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;