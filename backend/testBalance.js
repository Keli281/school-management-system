const mongoose = require('mongoose');
require('dotenv').config();
const FeePayment = require('./models/FeePayment');
const Student = require('./models/Student');
const FeeStructure = require('./models/FeeStructure');

const testBalance = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find Stephen
    const student = await Student.findOne({ firstName: 'Stephen', lastName: 'Musau' });
    console.log('👤 Student:', student.firstName, student.lastName, 'Grade:', student.grade);
    
    // Get all payments for Term 3 2025
    const payments = await FeePayment.find({
      studentId: student._id,
      term: 'Term 3',
      academicYear: '2025'
    }).sort({ datePaid: 1 });
    
    console.log('📊 Payments found:', payments.length);
    payments.forEach(p => {
      console.log(`   - ${p.amountPaid} paid on ${p.datePaid.toISOString().split('T')[0]}`);
    });
    
    // Calculate balance manually
    const feeStructure = await FeeStructure.findOne({
      grade: student.grade,
      academicYear: '2025'
    });
    
    const termTotal = feeStructure.term3Amount;
    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    const balance = termTotal - totalPaid;
    
    console.log('🧮 Manual Calculation:');
    console.log(`   Term Total: ${termTotal}`);
    console.log(`   Total Paid: ${totalPaid}`);
    console.log(`   Balance: ${balance}`);
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

testBalance();