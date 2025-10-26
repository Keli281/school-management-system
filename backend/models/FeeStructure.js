const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  grade: {
    type: String,
    required: true,
    unique: true,
    enum: ['Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4']
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

module.exports = mongoose.model('FeeStructure', feeStructureSchema);