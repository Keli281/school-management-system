import React, { useState, useEffect } from 'react';
import { feesAPI, studentsAPI } from '../services/api';

const Fees = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '',
    term: 'Term 1',
    academicYear: '2026',
    amountPaid: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, studentsRes, structuresRes] = await Promise.all([
        feesAPI.getPayments(),
        studentsAPI.getAll(),
        feesAPI.getFeeStructures()
      ]);
      setPayments(paymentsRes.data.payments);
      setStudents(studentsRes.data.students);
      setFeeStructures(structuresRes.data.structures);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    try {
      console.log('🔄 STEP A: Form submitted with data:', formData);

      const paymentData = {
        studentId: formData.studentId,
        term: formData.term,
        academicYear: formData.academicYear,
        amountPaid: Number(formData.amountPaid)
      };

      console.log('🔄 STEP B: Sending to backend:', paymentData);

      if (editingPayment) {
        await feesAPI.updatePayment(editingPayment._id, paymentData);
        alert('Payment updated successfully!');
      } else {
        await feesAPI.recordPayment(paymentData);
        alert('Payment recorded successfully!');
      }
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error('❌ Frontend Error:', error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setFormData({
      studentId: payment.studentId,
      term: payment.term,
      academicYear: payment.academicYear,
      amountPaid: payment.amountPaid.toString()
    });
    setShowPaymentForm(true);
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await feesAPI.deletePayment(paymentId);
        alert('Payment deleted successfully!');
        fetchData();
      } catch (error) {
        alert('Error deleting payment: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const resetForm = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    setFormData({ 
      studentId: '', 
      term: 'Term 1', 
      academicYear: '2026',
      amountPaid: '' 
    });
  };

  // Calculate total collected
  const totalCollected = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);

  // Calculate fees collected per grade
  const feesPerGrade = students.reduce((acc, student) => {
    const gradePayments = payments.filter(p => p.studentId === student._id);
    const gradeTotal = gradePayments.reduce((sum, payment) => sum + payment.amountPaid, 0);
    acc[student.grade] = (acc[student.grade] || 0) + gradeTotal;
    return acc;
  }, {});

  const grades = ['Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-maroon to-dark-maroon rounded-2xl shadow-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-black">Fees Management</h1>
            <p className="text-gold mt-2 font-medium">Track and manage student fee payments</p>
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-right">
            <p className="text-2xl font-bold text-black">KSh {totalCollected.toLocaleString()}</p>
            <p className="text-gold font-medium">Total Collected</p>
          </div>
        </div>
      </div>

      {/* Fees Collected Per Grade - NEW LAYOUT */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Fees Collected Per Grade</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {grades.map(grade => (
            <div key={grade} className="text-center bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-2 truncate" title={grade}>
                {grade.replace('Grade', 'G')}
              </p>
              <p className="text-lg font-bold text-green-600">
                KSh {(feesPerGrade[grade] || 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold text-gray-800">Fee Payments</h2>
        <button 
          className="bg-maroon text-white px-4 py-2 rounded-lg hover:bg-dark-maroon transition-colors flex items-center"
          onClick={() => setShowPaymentForm(true)}
        >
          <span className="mr-2">+</span>
          {editingPayment ? 'Update Payment' : 'Record Payment'}
        </button>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-maroon">
              {editingPayment ? 'Edit Payment' : 'Record Fee Payment'}
            </h2>
            
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                  disabled={editingPayment}
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.admissionNumber} - {student.firstName} {student.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Term
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.term}
                  onChange={(e) => setFormData({...formData, term: e.target.value})}
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Paid (KSh)
                </label>
                <input
                  type="number"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.amountPaid}
                  onChange={(e) => setFormData({...formData, amountPaid: e.target.value})}
                  placeholder="Enter amount"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-maroon text-white py-2 rounded-lg hover:bg-dark-maroon transition-colors"
                >
                  {editingPayment ? 'Update Payment' : 'Record Payment'}
                </button>
                <button
                  type="button"
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">
                  Term
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">
                  Amount Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.datePaid).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.studentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payment.academicYear === '2025' ? 'bg-blue-100 text-blue-800' :
                      payment.academicYear === '2026' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {payment.academicYear}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payment.term === 'Term 1' ? 'bg-blue-100 text-blue-800' :
                      payment.term === 'Term 2' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {payment.term}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    KSh {payment.amountPaid.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    KSh {payment.balance.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPayment(payment)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePayment(payment._id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {payments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">💰</div>
            <p className="text-lg mb-2">No fee payments recorded yet</p>
            <p className="text-sm">Click "Record Payment" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fees;