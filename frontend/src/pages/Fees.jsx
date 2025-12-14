import React, { useState, useEffect, useRef } from 'react';
import { feesAPI, studentsAPI } from '../services/api';

// Simple Toast Component for Fees page only
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg border transform transition-all duration-300 animate-slide-in`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {type === 'success' ? '✅' : '❌'}
          <span className="ml-2 font-medium">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const Fees = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // NEW: Toast state
  const [toast, setToast] = useState(null);
  
  // NEW: Filter states
  const [filters, setFilters] = useState({
    academicYear: '',
    term: '',
    grade: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // NEW: Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    term: 'Term 1',
    academicYear: '2026',
    amountPaid: '',
    datePaid: new Date().toISOString().split('T')[0]
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      
      const activeStudents = studentsRes.data.students.filter(student => student.isActive !== false);
      
      setPayments(paymentsRes.data.payments);
      setStudents(activeStudents);
      setFeeStructures(structuresRes.data.structures);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    try {
      console.log('🔄 Form submitted with data:', formData);

      const paymentData = {
        studentId: formData.studentId,
        term: formData.term,
        academicYear: formData.academicYear,
        amountPaid: Number(formData.amountPaid),
        datePaid: formData.datePaid
      };

      if (editingPayment) {
        await feesAPI.updatePayment(editingPayment._id, paymentData);
        showToast('Payment updated successfully!');
      } else {
        await feesAPI.recordPayment(paymentData);
        showToast('Payment recorded successfully!');
      }
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error('❌ Frontend Error:', error);
      showToast('Error: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
    setFormData({
      studentId: payment.studentId,
      studentName: payment.studentName,
      term: payment.term,
      academicYear: payment.academicYear,
      amountPaid: payment.amountPaid.toString(),
      datePaid: new Date(payment.datePaid).toISOString().split('T')[0]
    });
    setShowPaymentForm(true);
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await feesAPI.deletePayment(paymentId);
        showToast('Payment deleted successfully!');
        fetchData();
      } catch (error) {
        showToast('Error deleting payment: ' + (error.response?.data?.message || error.message), 'error');
      }
    }
  };

  const resetForm = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    setSearchTerm('');
    setShowDropdown(false);
    setFormData({ 
      studentId: '',
      studentName: '',
      term: 'Term 1', 
      academicYear: '2026',
      amountPaid: '',
      datePaid: new Date().toISOString().split('T')[0]
    });
  };

  // Filter students for dropdown
  const filteredStudents = searchTerm === '' 
    ? students 
    : students.filter(student => {
        const searchLower = searchTerm.toLowerCase();
        return (
          student.firstName.toLowerCase().includes(searchLower) ||
          student.lastName.toLowerCase().includes(searchLower) ||
          student.admissionNumber.toLowerCase().includes(searchLower) ||
          student.grade.toLowerCase().includes(searchLower)
        );
      });

  // Handle student selection
  const handleSelectStudent = (student) => {
    setFormData({
      ...formData,
      studentId: student._id,
      studentName: `${student.admissionNumber} - ${student.firstName} ${student.lastName} (${student.grade})`
    });
    setShowDropdown(false);
    setSearchTerm('');
  };

  // NEW: Apply filters to payments
  const filteredPayments = payments.filter(payment => {
    // Search filter
    if (searchTerm && !payment.studentName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Academic year filter
    if (filters.academicYear && payment.academicYear !== filters.academicYear) {
      return false;
    }
    
    // Term filter
    if (filters.term && payment.term !== filters.term) {
      return false;
    }
    
    // Grade filter
    if (filters.grade && payment.grade !== filters.grade) {
      return false;
    }
    
    // Date range filter
    if (filters.dateFrom && new Date(payment.datePaid) < new Date(filters.dateFrom)) {
      return false;
    }
    
    if (filters.dateTo && new Date(payment.datePaid) > new Date(filters.dateTo)) {
      return false;
    }
    
    return true;
  });

  // NEW: Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  // NEW: Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // NEW: Clear all filters
  const clearFilters = () => {
    setFilters({
      academicYear: '',
      term: '',
      grade: '',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
  };

  // Calculate total collected from filtered payments
  const totalCollected = filteredPayments.reduce((sum, payment) => sum + payment.amountPaid, 0);

  // Calculate fees collected per grade from filtered payments
  const feesPerGrade = filteredPayments.reduce((acc, payment) => {
    acc[payment.grade] = (acc[payment.grade] || 0) + payment.amountPaid;
    return acc;
  }, {});

  const grades = ['Day Care', 'Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-maroon to-dark-maroon rounded-2xl shadow-xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-black">Fees Management</h1>
            <p className="text-gold mt-2 font-medium">Track and manage student fee payments</p>
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-right">
            <p className="text-2xl font-bold text-black">KSh {totalCollected.toLocaleString()}</p>
            <p className="text-gold font-medium">Total Collected (Filtered)</p>
            <p className="text-sm text-gold/80">
              Showing {filteredPayments.length} of {payments.length} payments
            </p>
          </div>
        </div>
      </div>

      {/* Fees Collected Per Grade */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Fees Collected Per Grade (Filtered)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {grades.map(grade => (
            <div key={grade} className="text-center bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-2 truncate" title={grade}>
                {grade === 'Day Care' ? 'DC' : grade.replace('Grade', 'G')}
              </p>
              <p className="text-lg font-bold text-green-600">
                KSh {(feesPerGrade[grade] || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredPayments.filter(p => p.grade === grade).length} payments
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Fee Payments</h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              className="bg-maroon text-white px-4 py-2 rounded-lg hover:bg-dark-maroon transition-colors flex items-center"
              onClick={() => setShowPaymentForm(true)}
            >
              <span className="mr-2">+</span>
              Record Payment
            </button>
            
            {(filters.academicYear || filters.term || filters.grade || filters.dateFrom || filters.dateTo) && (
              <button
                onClick={clearFilters}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Payments</label>
            <input
              type="text"
              placeholder="Search by student name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
              value={filters.academicYear}
              onChange={(e) => setFilters({...filters, academicYear: e.target.value})}
            >
              <option value="">All Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
              value={filters.term}
              onChange={(e) => setFilters({...filters, term: e.target.value})}
            >
              <option value="">All Terms</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
              value={filters.grade}
              onChange={(e) => setFilters({...filters, grade: e.target.value})}
            >
              <option value="">All Grades</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        {/* Filter Summary */}
        {(filters.academicYear || filters.term || filters.grade || filters.dateFrom || filters.dateTo) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-800">Active Filters:</span>
                <div className="flex flex-wrap gap-2">
                  {filters.academicYear && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Year: {filters.academicYear}
                    </span>
                  )}
                  {filters.term && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Term: {filters.term}
                    </span>
                  )}
                  {filters.grade && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      Grade: {filters.grade}
                    </span>
                  )}
                  {filters.dateFrom && filters.dateTo && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      {filters.dateFrom} to {filters.dateTo}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Form Modal - Same as before */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-maroon">
              {editingPayment ? 'Edit Payment' : 'Record Fee Payment'}
            </h2>
            
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Student dropdown - Same as before */}
              <div ref={dropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student *
                </label>
                
                <div 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors cursor-pointer bg-white flex justify-between items-center"
                  onClick={() => !editingPayment && setShowDropdown(!showDropdown)}
                >
                  <span className={formData.studentName ? "text-gray-900" : "text-gray-500"}>
                    {formData.studentName || "Select Student"}
                  </span>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'transform rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {showDropdown && !editingPayment && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    <div className="sticky top-0 bg-white p-2 border-b">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-1 px-1">
                        {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                      </p>
                    </div>

                    <div className="py-1">
                      {filteredStudents.length === 0 ? (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          No students found matching "{searchTerm}"
                        </div>
                      ) : (
                        filteredStudents.map(student => (
                          <div
                            key={student._id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                            onClick={() => handleSelectStudent(student)}
                          >
                            <div className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {student.admissionNumber} • {student.grade}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
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
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.datePaid}
                  onChange={(e) => setFormData({...formData, datePaid: e.target.value})}
                />
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
                  Grade
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
              {currentPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.datePaid).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.studentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payment.grade.includes('Grade') ? 'bg-blue-100 text-blue-800' :
                      payment.grade.includes('PP') ? 'bg-green-100 text-green-800' :
                      payment.grade === 'Day Care' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {payment.grade}
                    </span>
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
                    KSh {(payment.balance || 0).toLocaleString()}
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
        
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">💰</div>
            <p className="text-lg mb-2">No fee payments found</p>
            <p className="text-sm">Try adjusting your search terms or filters</p>
          </div>
        ) : (
          // NEW: Pagination Controls
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredPayments.length)}
                </span>{' '}
                of <span className="font-medium">{filteredPayments.length}</span> results
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Items per page:</span>
                  <select
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    // Show only first, last, and pages around current
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-1 rounded-md text-sm ${
                            currentPage === pageNumber
                              ? 'bg-maroon text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md text-sm ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fees;