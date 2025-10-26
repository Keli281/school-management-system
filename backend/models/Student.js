const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  admissionNumber: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true,
    enum: ['Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4']
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female']
  },
  parentName: {
    type: String,
    required: true
  },
  parentPhone: {
    type: String,
    required: true
  },
  knecCode: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // This automatically adds createdAt and updatedAt
});

// This will be our collection name in MongoDB
module.exports = mongoose.model('Student', studentSchema);