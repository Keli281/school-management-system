const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  admissionNumber: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  term: {
    type: String,
    required: true,
    enum: ['Term 1', 'Term 2', 'Term 3']
  },
  academicYear: {
    type: String,
    required: true // REMOVED THE DEFAULT VALUE
  },
  amountPaid: {
    type: Number,
    required: true
  },
  balance: {
    type: Number
  },
  datePaid: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FeePayment', feePaymentSchema);