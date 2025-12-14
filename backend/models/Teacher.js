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
  primaryGradeAssigned: {
    type: String,
    required: true,
    enum: ['Day Care', 'Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'],
    default: 'Day Care'
  },
  additionalGrades: {
    type: [String],
    default: [],
    validate: {
      validator: function(grades) {
        const validGrades = ['Day Care', 'Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];
        return grades.every(grade => validGrades.includes(grade));
      },
      message: 'Invalid grade value in additional grades'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Remove any old gradeAssigned field if it exists
teacherSchema.pre('save', function(next) {
  // Remove old field if it somehow got added
  if (this.gradeAssigned !== undefined) {
    this.gradeAssigned = undefined;
  }
  next();
});

module.exports = mongoose.model('Teacher', teacherSchema);