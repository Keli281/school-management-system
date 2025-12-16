const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
const NonTeachingStaff = require('../models/NonTeachingStaff');
require('dotenv').config();

const migrateData = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB!');
    
    // Migrate Teachers
    console.log('🔄 Migrating teachers data...');
    const teachers = await Teacher.find({});
    
    for (const teacher of teachers) {
      // If teacher has old paymentHistory, migrate to monthlyPayments
      if (teacher.paymentHistory && Array.isArray(teacher.paymentHistory)) {
        console.log(`Migrating teacher: ${teacher.firstName} ${teacher.lastName}`);
        
        teacher.monthlyPayments = teacher.paymentHistory.map(payment => ({
          year: new Date(payment.date).getFullYear() || payment.year || new Date().getFullYear(),
          month: payment.month || new Date(payment.date).toLocaleString('default', { month: 'long' }),
          amount: payment.amount || teacher.salary?.amount || 0,
          paidDate: payment.date,
          paidBy: 'Admin',
          notes: payment.notes || 'Migrated from old payment history',
          status: 'Paid',
          createdAt: payment.date
        }));
        
        // Remove old fields
        teacher.paymentHistory = undefined;
        teacher.isPaidForCurrentMonth = undefined;
        teacher.lastPaymentDate = undefined;
        
        await teacher.save();
      }
    }
    
    // Migrate NonTeachingStaff
    console.log('🔄 Migrating non-teaching staff data...');
    const staff = await NonTeachingStaff.find({});
    
    for (const staffMember of staff) {
      // If staff has old paymentHistory, migrate to monthlyPayments
      if (staffMember.paymentHistory && Array.isArray(staffMember.paymentHistory)) {
        console.log(`Migrating staff: ${staffMember.firstName} ${staffMember.lastName}`);
        
        staffMember.monthlyPayments = staffMember.paymentHistory.map(payment => ({
          year: new Date(payment.date).getFullYear() || payment.year || new Date().getFullYear(),
          month: payment.month || new Date(payment.date).toLocaleString('default', { month: 'long' }),
          amount: payment.amount || staffMember.salary?.amount || 0,
          paidDate: payment.date,
          paidBy: 'Admin',
          notes: payment.notes || 'Migrated from old payment history',
          status: 'Paid',
          createdAt: payment.date
        }));
        
        // Remove old fields
        staffMember.paymentHistory = undefined;
        staffMember.isPaidForCurrentMonth = undefined;
        staffMember.lastPaymentDate = undefined;
        
        await staffMember.save();
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log(`📊 Migrated ${teachers.length} teachers and ${staff.length} staff members`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run migration
migrateData();