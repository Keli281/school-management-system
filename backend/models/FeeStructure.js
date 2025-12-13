const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  grade: {
    type: String,
    required: true,
    enum: ['Day Care', 'Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4']
  },
  academicYear: {
    type: String,
    required: true,
    default: '2025'
  },
  term1Amount: {
    type: Number,
    required: true
  },
  term2Amount: {
    type: Number,
    required: true
  },
  term3Amount: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Create compound index to ensure unique fee structure per grade and academic year
feeStructureSchema.index({ grade: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);