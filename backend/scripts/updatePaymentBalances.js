const mongoose = require('mongoose');
const FeePayment = require('../models/FeePayment');
const FeeStructure = require('../models/FeeStructure');
const Student = require('../models/Student');
require('dotenv').config();

async function updateAllPaymentBalances() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const allPayments = await FeePayment.find().sort({ studentId: 1, academicYear: 1, term: 1, datePaid: 1 });
    console.log(`📊 Found ${allPayments.length} payments to update`);

    let updatedCount = 0;
    let errorCount = 0;

    // Group payments by student, academic year, and term
    const groupedPayments = {};
    
    for (const payment of allPayments) {
      const key = `${payment.studentId}-${payment.academicYear}-${payment.term}`;
      if (!groupedPayments[key]) {
        groupedPayments[key] = [];
      }
      groupedPayments[key].push(payment);
    }

    // Update each group
    for (const [key, payments] of Object.entries(groupedPayments)) {
      try {
        const student = await Student.findById(payments[0].studentId);
        if (!student) continue;

        const feeStructure = await FeeStructure.findOne({
          grade: student.grade,
          academicYear: payments[0].academicYear
        });

        if (!feeStructure) continue;

        const termNumber = payments[0].term.split(' ')[1];
        const termTotal = feeStructure[`term${termNumber}Amount`];

        let runningTotalPaid = 0;
        
        // Sort payments by date
        payments.sort((a, b) => new Date(a.datePaid) - new Date(b.datePaid));

        for (const payment of payments) {
          runningTotalPaid += payment.amountPaid;
          const balance = termTotal - runningTotalPaid;
          
          // Update only if balance has changed
          if (payment.balance !== balance) {
            payment.balance = balance;
            await payment.save();
            updatedCount++;
            console.log(`   Updated payment ${payment._id}: balance = ${balance}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error updating group ${key}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 UPDATE COMPLETE:`);
    console.log(`   Total payments processed: ${allPayments.length}`);
    console.log(`   Payments updated: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

updateAllPaymentBalances();