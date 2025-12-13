const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
require('dotenv').config();

async function updateExistingTeachers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all teachers with "None" grade assigned
    const teachersWithNone = await Teacher.find({ gradeAssigned: 'None' });
    console.log(`📊 Found ${teachersWithNone.length} teachers with "None" assignment`);

    // Update them to "Day Care"
    for (const teacher of teachersWithNone) {
      teacher.gradeAssigned = 'Day Care';
      await teacher.save();
      console.log(`✅ Updated teacher ${teacher.firstName} ${teacher.lastName} to "Day Care"`);
    }

    console.log('\n🎉 UPDATE COMPLETE:');
    console.log(`   Updated ${teachersWithNone.length} teachers from "None" to "Day Care"`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateExistingTeachers();