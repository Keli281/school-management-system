const express = require('express');
const router = express.Router();
const FeePayment = require('../models/FeePayment');
const FeeStructure = require('../models/FeeStructure');
const Student = require('../models/Student');
const { auth } = require('../middleware/authMiddleware');

// === FEE STRUCTURE ROUTES ===
router.get('/structure', auth, async (req, res) => {
  try {
    const structures = await FeeStructure.find().sort({ academicYear: -1, grade: 1 });
    res.json({ success: true, structures: structures });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching fee structures', error: error.message });
  }
});

// === FEE PAYMENT ROUTES ===
router.get('/payments', auth, async (req, res) => {
  try {
    const payments = await FeePayment.find().sort({ datePaid: -1 });
    res.json({ success: true, count: payments.length, payments: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching fee payments', error: error.message });
  }
});

// GET fee payments for a specific student
router.get('/payments/student/:admissionNumber', auth, async (req, res) => {
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
    res.status(500).json({ success: false, message: 'Error fetching student fee payments', error: error.message });
  }
});

// IMPROVED BALANCE CALCULATION - CORRECT CUMULATIVE LOGIC
const calculateCurrentBalance = async (studentId, term, academicYear) => {
  try {
    // Get student and fee structure
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    const feeStructure = await FeeStructure.findOne({ 
      grade: student.grade, 
      academicYear: academicYear 
    });
    
    if (!feeStructure) {
      console.log(`⚠️ No fee structure found for ${student.grade} in ${academicYear}`);
      return 0;
    }

    const termNumber = term.split(' ')[1];
    const termTotal = feeStructure[`term${termNumber}Amount`];

    if (!termTotal || termTotal <= 0) {
      console.log(`⚠️ Term fee is 0 or not found for ${term} ${academicYear}`);
      return 0;
    }

    // Get ALL payments for this student in this term/year
    const payments = await FeePayment.find({
      studentId: studentId,
      term: term,
      academicYear: academicYear
    });

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);
    const balance = termTotal - totalPaid;
    
    console.log(`💰 CALCULATION: Term Total = ${termTotal}, Total Paid = ${totalPaid}, Balance = ${balance}`);
    return Math.max(balance, 0); // Ensure balance is never negative
  } catch (error) {
    console.error('❌ Error calculating balance:', error);
    return 0;
  }
};

// POST - Record a new fee payment (WITH CORRECT BALANCE CALCULATION)
router.post('/payments', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.body.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!req.body.academicYear) {
      return res.status(400).json({ success: false, message: 'Academic year required' });
    }

    // Calculate CURRENT balance BEFORE new payment
    const currentBalance = await calculateCurrentBalance(
      req.body.studentId, 
      req.body.term, 
      req.body.academicYear
    );

    console.log('💰 FEE CALCULATION DETAILS:');
    console.log('   Student:', `${student.firstName} ${student.lastName}`);
    console.log('   Grade:', student.grade);
    console.log('   Term:', req.body.term);
    console.log('   Academic Year:', req.body.academicYear);
    console.log('   CURRENT BALANCE (before payment):', currentBalance);
    console.log('   NEW PAYMENT AMOUNT:', req.body.amountPaid);
    
    const newBalance = currentBalance - req.body.amountPaid;
    console.log('   NEW BALANCE AFTER PAYMENT:', newBalance);

    // Create payment with balance field
    const paymentData = {
      studentId: req.body.studentId,
      admissionNumber: student.admissionNumber,
      studentName: `${student.firstName} ${student.lastName}`,
      grade: student.grade,
      term: req.body.term,
      academicYear: req.body.academicYear,
      amountPaid: req.body.amountPaid,
      balance: newBalance, // ✅ This will now be saved to database
      datePaid: req.body.datePaid || new Date()
    };

    const payment = new FeePayment(paymentData);
    await payment.save();
    
    console.log('✅ Payment saved with balance:', newBalance);
    
    res.status(201).json({
      success: true,
      message: 'Fee payment recorded successfully!',
      payment: payment,
      currentBalance: newBalance
    });
  } catch (error) {
    console.error('❌ Payment Error:', error);
    res.status(400).json({ success: false, message: 'Error recording fee payment', error: error.message });
  }
});

// PUT - Update a fee payment
router.put('/payments/:id', auth, async (req, res) => {
  try {
    const payment = await FeePayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // If amount is being updated, we need to recalculate balances for all subsequent payments
    if (req.body.amountPaid !== undefined && req.body.amountPaid !== payment.amountPaid) {
      // First update this payment
      const updateData = {
        amountPaid: req.body.amountPaid,
        ...(req.body.datePaid && { datePaid: req.body.datePaid })
      };

      const updatedPayment = await FeePayment.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      // Recalculate and update all payments for this student in same term/year
      const allPayments = await FeePayment.find({
        studentId: payment.studentId,
        term: payment.term,
        academicYear: payment.academicYear
      }).sort({ datePaid: 1 }); // Sort by date ascending

      const student = await Student.findById(payment.studentId);
      const feeStructure = await FeeStructure.findOne({
        grade: student.grade,
        academicYear: payment.academicYear
      });

      if (feeStructure) {
        const termNumber = payment.term.split(' ')[1];
        const termTotal = feeStructure[`term${termNumber}Amount`];
        let runningTotalPaid = 0;

        for (const paymentRecord of allPayments) {
          runningTotalPaid += paymentRecord.amountPaid;
          const newBalance = termTotal - runningTotalPaid;
          
          if (paymentRecord.balance !== newBalance) {
            paymentRecord.balance = newBalance;
            await paymentRecord.save();
          }
        }
      }

      res.json({
        success: true,
        message: 'Payment updated and balances recalculated successfully!',
        payment: updatedPayment
      });
    } else {
      // Just update date or other non-amount fields
      const updateData = {};
      if (req.body.datePaid) updateData.datePaid = req.body.datePaid;

      const updatedPayment = await FeePayment.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Payment updated successfully!',
        payment: updatedPayment
      });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating payment', error: error.message });
  }
});

// DELETE - Remove a fee payment
router.delete('/payments/:id', auth, async (req, res) => {
  try {
    const payment = await FeePayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    await FeePayment.findByIdAndDelete(req.params.id);

    // After deletion, recalculate balances for remaining payments
    const allPayments = await FeePayment.find({
      studentId: payment.studentId,
      term: payment.term,
      academicYear: payment.academicYear
    }).sort({ datePaid: 1 });

    const student = await Student.findById(payment.studentId);
    const feeStructure = await FeeStructure.findOne({
      grade: student.grade,
      academicYear: payment.academicYear
    });

    if (feeStructure && allPayments.length > 0) {
      const termNumber = payment.term.split(' ')[1];
      const termTotal = feeStructure[`term${termNumber}Amount`];
      let runningTotalPaid = 0;

      for (const paymentRecord of allPayments) {
        runningTotalPaid += paymentRecord.amountPaid;
        const newBalance = termTotal - runningTotalPaid;
        
        if (paymentRecord.balance !== newBalance) {
          paymentRecord.balance = newBalance;
          await paymentRecord.save();
        }
      }
    }

    res.json({ 
      success: true, 
      message: 'Payment deleted and balances recalculated successfully!' 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error deleting payment', error: error.message });
  }
});

module.exports = router;