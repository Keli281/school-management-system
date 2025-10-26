const express = require('express');
const router = express.Router();
const FeePayment = require('../models/FeePayment');
const FeeStructure = require('../models/FeeStructure');
const Student = require('../models/Student');

// === FEE STRUCTURE ROUTES ===

// GET all fee structures
router.get('/structure', async (req, res) => {
  try {
    const structures = await FeeStructure.find().sort({ grade: 1 });
    res.json({
      success: true,
      structures: structures
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching fee structures',
      error: error.message
    });
  }
});

// POST - Add multiple fee structures at once
router.post('/structure/bulk', async (req, res) => {
  try {
    const structures = req.body.structures;
    
    if (!structures || !Array.isArray(structures)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of fee structures'
      });
    }

    const results = await FeeStructure.insertMany(structures);
    
    res.status(201).json({
      success: true,
      message: `Successfully added ${results.length} fee structures!`,
      structures: results
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding fee structures',
      error: error.message
    });
  }
});

// UPDATE fee structure
router.put('/structure/:grade', async (req, res) => {
  try {
    const structure = await FeeStructure.findOneAndUpdate(
      { grade: req.params.grade },
      req.body,
      { new: true, upsert: true }
    );
    res.json({
      success: true,
      message: 'Fee structure updated successfully!',
      structure: structure
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating fee structure',
      error: error.message
    });
  }
});

// === FEE PAYMENT ROUTES ===

// GET all fee payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await FeePayment.find().sort({ datePaid: -1 });
    res.json({
      success: true,
      count: payments.length,
      payments: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching fee payments',
      error: error.message
    });
  }
});

// GET fee payments for a specific student
router.get('/payments/student/:admissionNumber', async (req, res) => {
  try {
    const payments = await FeePayment.find({ 
      admissionNumber: req.params.admissionNumber 
    }).sort({ datePaid: -1 });
    
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
    
    res.json({
      success: true,
      payments: payments,
      summary: {
        totalPaid: totalPaid,
        paymentCount: payments.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student fee payments',
      error: error.message
    });
  }
});

// POST - Record a new fee payment (SMART VERSION)
router.post('/payments', async (req, res) => {
  try {
    // Get student details
    const student = await Student.findById(req.body.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get fee structure for student's grade
    const feeStructure = await FeeStructure.findOne({ grade: student.grade });
    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: `Fee structure not found for grade: ${student.grade}`
      });
    }

    // Calculate term total and balance
    const termNumber = req.body.term.split(' ')[1]; // Extract "1" from "Term 1"
    const termAmount = feeStructure[`term${termNumber}Amount`];
    const balance = termAmount - req.body.amountPaid;

    // Create payment record with calculated balance
    const paymentData = {
      studentId: req.body.studentId,
      admissionNumber: student.admissionNumber,
      studentName: `${student.firstName} ${student.lastName}`,
      grade: student.grade,
      term: req.body.term,
      year: req.body.year || '2025',
      amountPaid: req.body.amountPaid,
      balance: balance,
      datePaid: req.body.datePaid || new Date()
    };

    const payment = new FeePayment(paymentData);
    await payment.save();
    
    res.status(201).json({
      success: true,
      message: 'Fee payment recorded successfully!',
      payment: payment,
      calculation: {
        termTotal: termAmount,
        amountPaid: req.body.amountPaid,
        balance: balance
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error recording fee payment',
      error: error.message
    });
  }
});

// GET student fee balance summary
router.get('/balance/:admissionNumber', async (req, res) => {
  try {
    const student = await Student.findOne({ admissionNumber: req.params.admissionNumber });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const feeStructure = await FeeStructure.findOne({ grade: student.grade });
    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: `Fee structure not found for grade: ${student.grade}`
      });
    }

    // Get all payments for this student
    const payments = await FeePayment.find({ admissionNumber: req.params.admissionNumber });
    
    // Calculate totals per term
    const termSummary = {};
    ['Term 1', 'Term 2', 'Term 3'].forEach(term => {
      const termNumber = term.split(' ')[1];
      const termTotal = feeStructure[`term${termNumber}Amount`];
      const termPayments = payments.filter(p => p.term === term);
      const totalPaid = termPayments.reduce((sum, p) => sum + p.amountPaid, 0);
      const balance = termTotal - totalPaid;

      termSummary[term] = {
        termTotal: termTotal,
        totalPaid: totalPaid,
        balance: balance,
        paymentCount: termPayments.length
      };
    });

    res.json({
      success: true,
      student: {
        admissionNumber: student.admissionNumber,
        name: `${student.firstName} ${student.lastName}`,
        grade: student.grade
      },
      termSummary: termSummary,
      allPayments: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error calculating student balance',
      error: error.message
    });
  }
});

// GET fee dashboard summary
router.get('/dashboard/summary', async (req, res) => {
  try {
    const totalPayments = await FeePayment.aggregate([
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$amountPaid' },
          paymentCount: { $sum: 1 }
        }
      }
    ]);

    const termSummary = await FeePayment.aggregate([
      {
        $group: {
          _id: '$term',
          total: { $sum: '$amountPaid' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      summary: {
        totalCollected: totalPayments[0]?.totalCollected || 0,
        totalPayments: totalPayments[0]?.paymentCount || 0,
        byTerm: termSummary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching fee summary',
      error: error.message
    });
  }
});

// PUT - Update a fee payment
router.put('/payments/:id', async (req, res) => {
  try {
    const payment = await FeePayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Get student details for recalculation
    const student = await Student.findById(req.body.studentId || payment.studentId);
    const feeStructure = await FeeStructure.findOne({ grade: student.grade });
    
    const termNumber = req.body.term.split(' ')[1];
    const termAmount = feeStructure[`term${termNumber}Amount`];
    const balance = termAmount - req.body.amountPaid;

    const updatedPayment = await FeePayment.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        balance: balance,
        amountPaid: req.body.amountPaid
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Payment updated successfully!',
      payment: updatedPayment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating payment',
      error: error.message
    });
  }
});

// DELETE - Remove a fee payment
router.delete('/payments/:id', async (req, res) => {
  try {
    const payment = await FeePayment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment deleted successfully!'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deleting payment',
      error: error.message
    });
  }
});

module.exports = router;