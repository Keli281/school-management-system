const mongoose = require('mongoose');
const FeeStructure = require('../models/FeeStructure');
require('dotenv').config();

async function createDayCareFeeStructure() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if Day Care fee structure already exists for 2026
    const existing2026 = await FeeStructure.findOne({
      grade: 'Day Care',
      academicYear: '2026'
    });

    if (existing2026) {
      console.log('✅ Day Care fee structure for 2026 already exists:', existing2026);
    } else {
      // Create Day Care fee structure for 2026
      const dayCare2026 = new FeeStructure({
        grade: 'Day Care',
        academicYear: '2026',
        term1Amount: 2000,
        term2Amount: 2000,
        term3Amount: 2000
      });

      await dayCare2026.save();
      console.log('✅ Created Day Care fee structure for 2026');
    }

    // Check for 2025 (should NOT exist as per requirement)
    const existing2025 = await FeeStructure.findOne({
      grade: 'Day Care',
      academicYear: '2025'
    });

    if (existing2025) {
      console.log('⚠️ WARNING: Day Care fee structure for 2025 exists (should be deleted):', existing2025);
      console.log('   Run: await FeeStructure.deleteOne({ grade: "Day Care", academicYear: "2025" })');
    } else {
      console.log('✅ Good: No Day Care fee structure for 2025 (as required)');
    }

    // List all fee structures
    const allStructures = await FeeStructure.find().sort({ academicYear: -1, grade: 1 });
    console.log('\n📊 ALL FEE STRUCTURES:');
    allStructures.forEach(structure => {
      console.log(`   ${structure.grade} (${structure.academicYear}): T1=${structure.term1Amount}, T2=${structure.term2Amount}, T3=${structure.term3Amount}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createDayCareFeeStructure();