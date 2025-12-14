const mongoose = require('mongoose');
const Student = require('../models/Student');
require('dotenv').config();

async function addAdmissionFeeField() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update all existing students to have admissionFee field
    const result = await Student.updateMany(
      {},
      {
        $set: {
          'admissionFee.paid': false,
          'admissionFee.amount': 0,
          'admissionFee.academicYear': '2026',
          dateOfAdmission: new Date()
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} students with admission fee field`);
    
    // Test: Get one student to verify
    const testStudent = await Student.findOne({});
    console.log('🔍 Sample student after update:', {
      admissionNumber: testStudent.admissionNumber,
      admissionFee: testStudent.admissionFee,
      dateOfAdmission: testStudent.dateOfAdmission
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addAdmissionFeeField();