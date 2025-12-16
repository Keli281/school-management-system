const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const NonTeachingStaff = require('../models/NonTeachingStaff');
require('dotenv').config();

const resetPayrollData = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB!');
    
    // Reset Teachers' monthly payments
    console.log('🔄 Resetting teachers payroll data...');
    await Teacher.updateMany(
      {}, 
      { $set: { monthlyPayments: [] } }
    );
    console.log('✅ Teachers payroll data cleared!');
    
    // Reset Non-Teaching Staff monthly payments
    console.log('🔄 Resetting non-teaching staff payroll data...');
    await NonTeachingStaff.updateMany(
      {}, 
      { $set: { monthlyPayments: [] } }
    );
    console.log('✅ Non-teaching staff payroll data cleared!');
    
    console.log('🎉 All payroll data has been reset!');
    console.log('📝 Staff records are preserved, only payment history is cleared.');
    
  } catch (error) {
    console.error('❌ Error resetting payroll data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run reset
resetPayrollData();