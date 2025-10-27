const express = require('express');
const router = express.Router();
const FeePayment = require('../models/FeePayment');
const FeeStructure = require('../models/FeeStructure');
const Student = require('../models/Student');

// === FEE STRUCTURE ROUTES ===

// GET all fee structures
router.get('/structure', async (req, res) => {
  try {
    const structures = await FeeStructure.find().sort({ academicYear: -1, grade: 1 });
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
    }).sort({ academicYear: -1, datePaid: -1 });
    
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

// POST - Record a new fee payment (FIXED VERSION)
router.post('/payments', async (req, res) => {
  try {
    console.log('🎯 STEP 1: Received payment data from frontend:', req.body);

    // Get student details
    const student = await Student.findById(req.body.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    console.log('🎯 STEP 2: Student found - Grade:', student.grade);

    // Use the academicYear from request body
    const academicYear = req.body.academicYear;
    console.log('🎯 STEP 3: Academic Year from frontend:', academicYear);
    
    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Academic year is required'
      });
    }

    // Get fee structure for student's grade and academic year
    console.log('🎯 STEP 4: Looking for fee structure - Grade:', student.grade, 'Year:', academicYear);
    
    const feeStructure = await FeeStructure.findOne({ 
      grade: student.grade,
      academicYear: academicYear
    });
    
    console.log('🎯 STEP 5: Fee structure found:', feeStructure);
    
    if (!feeStructure) {
      console.log('❌ ERROR: No fee structure found for:', { grade: student.grade, year: academicYear });
      
      // Show all available fee structures for debugging
      const allStructures = await FeeStructure.find({ grade: student.grade });
      console.log('📋 Available fee structures for this grade:', allStructures);
      
      return res.status(404).json({
        success: false,
        message: `Fee structure not found for grade: ${student.grade} and academic year: ${academicYear}. Available years: ${allStructures.map(s => s.academicYear).join(', ')}`
      });
    }

    // Calculate term total and balance
    const termNumber = req.body.term.split(' ')[1]; // Extract "1" from "Term 1"
    const termAmount = feeStructure[`term${termNumber}Amount`];
    
    console.log('🎯 STEP 6: Calculation details:');
    console.log('   - Term:', req.body.term);
    console.log('   - Term Number:', termNumber);
    console.log('   - Term Amount from DB:', termAmount);
    console.log('   - Amount Paid:', req.body.amountPaid);
    
    const balance = termAmount - req.body.amountPaid;
    console.log('   - Balance Calculated:', balance);

    // Create payment record with calculated balance
    const paymentData = {
      studentId: req.body.studentId,
      admissionNumber: student.admissionNumber,
      studentName: `${student.firstName} ${student.lastName}`,
      grade: student.grade,
      term: req.body.term,
      academicYear: academicYear, // This is the KEY - using the selected year
      amountPaid: req.body.amountPaid,
      balance: balance,
      datePaid: req.body.datePaid || new Date()
    };

    console.log('🎯 STEP 7: Saving payment with data:', paymentData);

    const payment = new FeePayment(paymentData);
    await payment.save();
    
    console.log('✅ SUCCESS: Payment saved to database!');
    console.log('   - Academic Year in saved payment:', payment.academicYear);
    console.log('   - Balance in saved payment:', payment.balance);
    
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
    console.error('💥 BIG ERROR:', error);
    res.status(400).json({
      success: false,
      message: 'Error recording fee payment',
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
    const academicYear = req.body.academicYear || payment.academicYear;
    
    const feeStructure = await FeeStructure.findOne({ 
      grade: student.grade,
      academicYear: academicYear
    });
    
    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: `Fee structure not found for grade: ${student.grade} and academic year: ${academicYear}`
      });
    }
    
    const termNumber = (req.body.term || payment.term).split(' ')[1];
    const termAmount = feeStructure[`term${termNumber}Amount`];
    const balance = termAmount - req.body.amountPaid;

    const updatedPayment = await FeePayment.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        balance: balance,
        amountPaid: req.body.amountPaid,
        academicYear: academicYear
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