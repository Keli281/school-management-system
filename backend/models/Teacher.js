const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  gradeAssigned: {
    type: String,
    required: true,
    enum: ['Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'None']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true  // This automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('Teacher', teacherSchema);