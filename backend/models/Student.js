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
    enum: ['Day Care', 'Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4']
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
  // NEW: Admission fee tracking
  admissionFee: {
    paid: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      default: 0
    },
    paymentDate: {
      type: Date
    },
    academicYear: {
      type: String,
      default: '2026' // Default for new admissions
    }
  },
  // NEW: Date of admission for filtering
  dateOfAdmission: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual property to check if student is from 2026 onwards
studentSchema.virtual('isFrom2026OrLater').get(function() {
  const admissionYear = this.admissionNumber.match(/\/(\d{4})$/);
  if (admissionYear) {
    return parseInt(admissionYear[1]) >= 2026;
  }
  return false;
});

module.exports = mongoose.model('Student', studentSchema);