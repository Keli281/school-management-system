const mongoose = require('mongoose');
const Teacher = require('../models/Teacher');
require('dotenv').config();

async function migrateTeacherGrades() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all teachers
    const teachers = await Teacher.find({});
    console.log(`📊 Found ${teachers.length} teachers to migrate`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const teacher of teachers) {
      try {
        // Rename gradeAssigned to primaryGradeAssigned
        // Mongoose will handle this automatically if we save the document
        // But we need to explicitly move the value
        
        // Check if teacher already has new structure
        if (teacher.primaryGradeAssigned && teacher.additionalGrades !== undefined) {
          console.log(`⏩ Teacher ${teacher.firstName} ${teacher.lastName} already migrated, skipping`);
          continue;
        }

        // Migrate old field to new field
        if (teacher.gradeAssigned) {
          teacher.primaryGradeAssigned = teacher.gradeAssigned;
          teacher.additionalGrades = []; // Start with empty array
          
          // Optionally remove old field
          // teacher.gradeAssigned = undefined;
          
          await teacher.save();
          
          updatedCount++;
          console.log(`✅ Migrated teacher ${teacher.firstName} ${teacher.lastName}: primaryGrade = "${teacher.primaryGradeAssigned}", additionalGrades = []`);
        } else {
          console.log(`⚠️ Teacher ${teacher.firstName} ${teacher.lastName} has no gradeAssigned, setting default`);
          teacher.primaryGradeAssigned = 'Day Care';
          teacher.additionalGrades = [];
          await teacher.save();
          updatedCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating teacher ${teacher._id}:`, error.message);
      }
    }

    console.log('\n🎉 MIGRATION COMPLETE:');
    console.log(`   Teachers updated: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    // Final verification
    const allTeachers = await Teacher.find({});
    console.log('\n🔍 FINAL VERIFICATION (first 5 teachers):');
    allTeachers.slice(0, 5).forEach(t => {
      console.log(`   ${t.firstName} ${t.lastName}:`);
      console.log(`     Primary: ${t.primaryGradeAssigned}`);
      console.log(`     Additional: ${JSON.stringify(t.additionalGrades)}`);
      console.log(`     Old gradeAssigned: ${t.gradeAssigned || '(not present)'}`);
    });

    console.log('\n💡 Next steps:');
    console.log('   1. Update backend routes to use new field names');
    console.log('   2. Update frontend to handle multiple grades');
    console.log('   3. Deploy updated model');
    console.log('   4. Remove gradeAssigned field from model (optional)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

migrateTeacherGrades();