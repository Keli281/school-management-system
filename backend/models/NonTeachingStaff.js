const mongoose = require('mongoose');

const nonTeachingStaffSchema = new mongoose.Schema({
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
  role: {
    type: String,
    required: true,
    enum: ['Driver', 'Gardener', 'Cleaner', 'Cook', 'Security', 'Other'],
    default: 'Other'
  },
  employmentDate: {
    type: Date,
    default: Date.now
  },
  salary: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'KSh'
    },
    paymentFrequency: {
      type: String,
      enum: ['Monthly', 'Weekly', 'Daily', 'Other'],
      default: 'Monthly'
    }
  },
  
  // FIXED: Monthly payment tracking - ARRAY for EACH month
  monthlyPayments: [{
    year: Number,
    month: String, // "January", "February", etc.
    amount: Number, // ACTUAL amount paid that month (separate from salary amount)
    paidDate: Date,
    paidBy: String,
    notes: String,
    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Partial'],
      default: 'Pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Helper method to get payment status for a specific month
nonTeachingStaffSchema.methods.getPaymentStatus = function(year, month) {
  const payment = this.monthlyPayments.find(
    p => p.year === year && p.month === month
  );
  
  return payment ? {
    status: payment.status,
    amount: payment.amount,
    paidDate: payment.paidDate,
    notes: payment.notes
  } : {
    status: 'Pending',
    amount: 0,
    paidDate: null,
    notes: 'Not yet paid'
  };
};

// Helper method to mark as paid for a specific month
nonTeachingStaffSchema.methods.markAsPaid = function(year, month, amount, notes, paidBy) {
  // Remove existing payment for this month if any
  this.monthlyPayments = this.monthlyPayments.filter(
    p => !(p.year === year && p.month === month)
  );
  
  // Add new payment record
  this.monthlyPayments.push({
    year,
    month,
    amount: amount || this.salary.amount,
    paidDate: new Date(),
    paidBy: paidBy || 'Admin',
    notes: notes || `Salary payment for ${month} ${year}`,
    status: 'Paid'
  });
  
  return this.save();
};

module.exports = mongoose.model('NonTeachingStaff', nonTeachingStaffSchema);