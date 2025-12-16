import React, { useState, useEffect } from 'react';
import { teachersAPI, nonTeachingStaffAPI } from '../services/api';

// Toast Component
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

const Payroll = () => {
  const [teachers, setTeachers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isProcessing, setIsProcessing] = useState(false);
  
  // NEW: Search states for teachers
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherCurrentPage, setTeacherCurrentPage] = useState(1);
  const [teacherItemsPerPage, setTeacherItemsPerPage] = useState(5);
  
  // NEW: Search states for staff
  const [staffSearch, setStaffSearch] = useState('');
  const [staffCurrentPage, setStaffCurrentPage] = useState(1);
  const [staffItemsPerPage, setStaffItemsPerPage] = useState(5);
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = [2024, 2025, 2026, 2027];

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const [teachersRes, staffRes] = await Promise.all([
        teachersAPI.getAll(),
        nonTeachingStaffAPI.getAll()
      ]);
      
      setTeachers(teachersRes.data.teachers || []);
      setStaff(staffRes.data.staff || []);
    } catch (error) {
      console.error('Error fetching staff data:', error);
      showToast('Error loading staff data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check payment status for a specific month
  const getPaymentStatus = (person, year, month) => {
    if (!person.monthlyPayments || !Array.isArray(person.monthlyPayments)) {
      return { status: 'Pending', amount: 0 };
    }
    
    const payment = person.monthlyPayments.find(
      p => p.year === year && p.month === month
    );
    
    return payment ? {
      status: payment.status,
      amount: payment.amount || person.salary?.amount || 0
    } : {
      status: 'Pending',
      amount: 0
    };
  };

  // Get last payment date for display
  const getLastPaymentDate = (person) => {
    if (!person.monthlyPayments || person.monthlyPayments.length === 0) {
      return null;
    }
    
    // Sort by date and get the most recent
    const sorted = [...person.monthlyPayments].sort((a, b) => 
      new Date(b.paidDate || b.createdAt) - new Date(a.paidDate || a.createdAt)
    );
    
    return sorted[0]?.paidDate || sorted[0]?.createdAt;
  };

  const handleMarkPaid = async (type, id, name) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const person = type === 'teacher' 
        ? teachers.find(t => t._id === id)
        : staff.find(s => s._id === id);
      
      if (!person) {
        showToast(`${type} not found!`, 'error');
        setIsProcessing(false);
        return;
      }

      const paymentData = {
        month: selectedMonth,
        year: selectedYear,
        amount: person.salary?.amount || 0,
        notes: `Salary payment for ${selectedMonth} ${selectedYear}`
      };
      
      if (type === 'teacher') {
        await teachersAPI.markPaid(id, paymentData);
        showToast(`${name} marked as paid for ${selectedMonth} ${selectedYear}`);
      } else {
        await nonTeachingStaffAPI.markPaid(id, paymentData);
        showToast(`${name} marked as paid for ${selectedMonth} ${selectedYear}`);
      }
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error marking as paid:', error);
      showToast('Error: ' + error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // NEW: SIMPLE UNDO PAYMENT FUNCTION - NO BACKEND CHANGES NEEDED
  const handleUndoPayment = async (type, id, name) => {
    if (isProcessing) return;
    
    if (!window.confirm(`Undo payment for ${name} for ${selectedMonth} ${selectedYear}?\nThis will mark them as unpaid for this month.`)) {
      return;
    }
    
    setIsProcessing(true);
    try {
      // Get current person data
      const person = type === 'teacher' 
        ? teachers.find(t => t._id === id)
        : staff.find(s => s._id === id);
      
      if (!person) {
        showToast(`${type} not found!`, 'error');
        setIsProcessing(false);
        return;
      }
      
      // Create updated monthly payments array without the current month's payment
      const updatedMonthlyPayments = (person.monthlyPayments || []).filter(
        payment => !(payment.year === selectedYear && payment.month === selectedMonth)
      );
      
      // Update the staff member using the existing update API
      const updateData = {
        monthlyPayments: updatedMonthlyPayments
      };
      
      if (type === 'teacher') {
        await teachersAPI.update(id, updateData);
      } else {
        await nonTeachingStaffAPI.update(id, updateData);
      }
      
      showToast(`Payment undone for ${name} (${selectedMonth} ${selectedYear})`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error undoing payment:', error);
      showToast('Error: ' + error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // NEW: Filter active teachers based on search
  const activeTeachers = teachers.filter(t => t.isActive);
  const filteredTeachers = activeTeachers.filter(teacher => {
    if (!teacherSearch.trim()) return true;
    
    const searchLower = teacherSearch.toLowerCase();
    return (
      teacher.firstName?.toLowerCase().includes(searchLower) ||
      teacher.lastName?.toLowerCase().includes(searchLower) ||
      teacher.email?.toLowerCase().includes(searchLower) ||
      teacher.primaryGradeAssigned?.toLowerCase().includes(searchLower) ||
      (teacher.additionalGrades?.some(grade => grade.toLowerCase().includes(searchLower)))
    );
  });

  // NEW: Filter active staff based on search
  const activeStaff = staff.filter(s => s.isActive);
  const filteredStaff = activeStaff.filter(staffMember => {
    if (!staffSearch.trim()) return true;
    
    const searchLower = staffSearch.toLowerCase();
    return (
      staffMember.firstName?.toLowerCase().includes(searchLower) ||
      staffMember.lastName?.toLowerCase().includes(searchLower) ||
      staffMember.email?.toLowerCase().includes(searchLower) ||
      staffMember.role?.toLowerCase().includes(searchLower) ||
      (staffMember.notes?.toLowerCase().includes(searchLower))
    );
  });

  // NEW: Pagination calculations for teachers
  const teacherIndexOfLastItem = teacherCurrentPage * teacherItemsPerPage;
  const teacherIndexOfFirstItem = teacherIndexOfLastItem - teacherItemsPerPage;
  const currentTeachers = filteredTeachers.slice(teacherIndexOfFirstItem, teacherIndexOfLastItem);
  const teacherTotalPages = Math.ceil(filteredTeachers.length / teacherItemsPerPage);

  // NEW: Pagination calculations for staff
  const staffIndexOfLastItem = staffCurrentPage * staffItemsPerPage;
  const staffIndexOfFirstItem = staffIndexOfLastItem - staffItemsPerPage;
  const currentStaff = filteredStaff.slice(staffIndexOfFirstItem, staffIndexOfLastItem);
  const staffTotalPages = Math.ceil(filteredStaff.length / staffItemsPerPage);

  // NEW: Payment statistics for filtered results
  const paidTeachers = filteredTeachers.filter(t => 
    getPaymentStatus(t, selectedYear, selectedMonth).status === 'Paid'
  );
  const unpaidTeachers = filteredTeachers.filter(t => 
    getPaymentStatus(t, selectedYear, selectedMonth).status !== 'Paid'
  );
  
  const paidStaff = filteredStaff.filter(s => 
    getPaymentStatus(s, selectedYear, selectedMonth).status === 'Paid'
  );
  const unpaidStaff = filteredStaff.filter(s => 
    getPaymentStatus(s, selectedYear, selectedMonth).status !== 'Paid'
  );
  
  const totalMonthlySalary = 
    filteredTeachers.reduce((sum, t) => sum + (t.salary?.amount || 0), 0) +
    filteredStaff.reduce((sum, s) => sum + (s.salary?.amount || 0), 0);

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

      {/* Header */}
      <div className="bg-gradient-to-r from-maroon to-dark-maroon rounded-2xl shadow-xl p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-black">Salary Payment Register</h1>
            <p className="text-gold mt-2">Monthly salary payment tracking for all staff</p>
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-right">
            <p className="text-2xl font-bold text-black">
              {activeTeachers.length + activeStaff.length}
            </p>
            <p className="text-sm text-gold">Active Staff Members</p>
          </div>
        </div>
      </div>

      {/* Month/Year Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Payment Register for: {selectedMonth} {selectedYear}
            </h2>
            <p className="text-sm text-gray-600">Select a month and year to view/manage payments for that period</p>
          </div>
          
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={isProcessing}
              >
                {months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                disabled={isProcessing}
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center border-l-4 border-blue-500">
          <p className="text-2xl font-bold text-blue-600">{filteredTeachers.length}</p>
          <p className="text-gray-600 text-sm">Teaching Staff</p>
          <div className="flex justify-center space-x-4 mt-2">
            <span className="text-sm text-green-600">{paidTeachers.length} paid</span>
            <span className="text-sm text-yellow-600">{unpaidTeachers.length} unpaid</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 text-center border-l-4 border-purple-500">
          <p className="text-2xl font-bold text-purple-600">{filteredStaff.length}</p>
          <p className="text-gray-600 text-sm">Support Staff</p>
          <div className="flex justify-center space-x-4 mt-2">
            <span className="text-sm text-green-600">{paidStaff.length} paid</span>
            <span className="text-sm text-yellow-600">{unpaidStaff.length} unpaid</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 text-center border-l-4 border-green-500">
          <p className="text-2xl font-bold text-green-600">
            KSh {totalMonthlySalary.toLocaleString()}
          </p>
          <p className="text-gray-600 text-sm">Monthly Payroll Total</p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredTeachers.length + filteredStaff.length} active staff members
          </p>
        </div>
      </div>

      {/* Teaching Staff Register with Search & Pagination */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Teaching Staff</h3>
              <p className="text-sm text-gray-600">
                {paidTeachers.length} of {filteredTeachers.length} paid for {selectedMonth} {selectedYear}
              </p>
            </div>
            
            {/* NEW: Teacher Search Bar */}
            <div className="w-full md:w-auto">
              <input
                type="text"
                placeholder="Search teachers..."
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={teacherSearch}
                onChange={(e) => {
                  setTeacherSearch(e.target.value);
                  setTeacherCurrentPage(1); // Reset to first page when searching
                }}
              />
            </div>
          </div>
          
          <div className="text-sm mt-2">
            <span className="text-green-600 font-medium">
              KSh {paidTeachers.reduce((sum, t) => sum + getPaymentStatus(t, selectedYear, selectedMonth).amount, 0).toLocaleString()} paid
            </span>
            <span className="mx-2">•</span>
            <span className="text-yellow-600">
              KSh {unpaidTeachers.reduce((sum, t) => sum + (t.salary?.amount || 0), 0).toLocaleString()} pending
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Teacher Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Grade Assigned</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Monthly Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Last Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentTeachers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">👨‍🏫</div>
                    <p className="text-lg">No teachers found</p>
                    {teacherSearch && <p className="text-sm mt-1">Try adjusting your search terms</p>}
                  </td>
                </tr>
              ) : (
                currentTeachers.map(teacher => {
                  const paymentStatus = getPaymentStatus(teacher, selectedYear, selectedMonth);
                  const isPaid = paymentStatus.status === 'Paid';
                  const lastPayment = getLastPaymentDate(teacher);
                  
                  return (
                    <tr key={teacher._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`w-4 h-4 rounded-full mx-auto ${
                          isPaid ? 'bg-green-500' : 'bg-yellow-500'
                        }`} title={isPaid ? 'Paid' : 'Pending'}></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {teacher.firstName} {teacher.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {teacher.primaryGradeAssigned}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        KSh {(teacher.salary?.amount || 0).toLocaleString()}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {lastPayment 
                          ? new Date(lastPayment).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          {isPaid ? (
                            <>
                              <button
                                onClick={() => handleMarkPaid('teacher', teacher._id, `${teacher.firstName} ${teacher.lastName}`)}
                                disabled={true}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium cursor-not-allowed"
                              >
                                Paid ✓
                              </button>
                              <button
                                onClick={() => handleUndoPayment('teacher', teacher._id, `${teacher.firstName} ${teacher.lastName}`)}
                                disabled={isProcessing}
                                className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                                title="Click to undo payment"
                              >
                                Undo
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleMarkPaid('teacher', teacher._id, `${teacher.firstName} ${teacher.lastName}`)}
                              disabled={isProcessing}
                              className="px-3 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* NEW: Teacher Pagination */}
        {filteredTeachers.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{teacherIndexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(teacherIndexOfLastItem, filteredTeachers.length)}
                </span>{' '}
                of <span className="font-medium">{filteredTeachers.length}</span> teachers
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Per page:</span>
                  <select
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={teacherItemsPerPage}
                    onChange={(e) => {
                      setTeacherItemsPerPage(Number(e.target.value));
                      setTeacherCurrentPage(1);
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
                    onClick={() => setTeacherCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={teacherCurrentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm ${
                      teacherCurrentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {[...Array(teacherTotalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    // Show first, last, and pages around current
                    if (
                      pageNumber === 1 ||
                      pageNumber === teacherTotalPages ||
                      (pageNumber >= teacherCurrentPage - 1 && pageNumber <= teacherCurrentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setTeacherCurrentPage(pageNumber)}
                          className={`px-3 py-1 rounded-md text-sm ${
                            teacherCurrentPage === pageNumber
                              ? 'bg-maroon text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      pageNumber === teacherCurrentPage - 2 ||
                      pageNumber === teacherCurrentPage + 2
                    ) {
                      return <span key={pageNumber} className="px-1 text-gray-500">...</span>;
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => setTeacherCurrentPage(prev => Math.min(teacherTotalPages, prev + 1))}
                    disabled={teacherCurrentPage === teacherTotalPages}
                    className={`px-3 py-1 rounded-md text-sm ${
                      teacherCurrentPage === teacherTotalPages
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

      {/* Non-Teaching Staff Register with Search & Pagination */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Support Staff</h3>
              <p className="text-sm text-gray-600">
                {paidStaff.length} of {filteredStaff.length} paid for {selectedMonth} {selectedYear}
              </p>
            </div>
            
            {/* NEW: Staff Search Bar */}
            <div className="w-full md:w-auto">
              <input
                type="text"
                placeholder="Search support staff..."
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={staffSearch}
                onChange={(e) => {
                  setStaffSearch(e.target.value);
                  setStaffCurrentPage(1); // Reset to first page when searching
                }}
              />
            </div>
          </div>
          
          <div className="text-sm mt-2">
            <span className="text-green-600 font-medium">
              KSh {paidStaff.reduce((sum, s) => sum + getPaymentStatus(s, selectedYear, selectedMonth).amount, 0).toLocaleString()} paid
            </span>
            <span className="mx-2">•</span>
            <span className="text-yellow-600">
              KSh {unpaidStaff.reduce((sum, s) => sum + (s.salary?.amount || 0), 0).toLocaleString()} pending
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Staff Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Monthly Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Last Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">👨‍🍳</div>
                    <p className="text-lg">No staff members found</p>
                    {staffSearch && <p className="text-sm mt-1">Try adjusting your search terms</p>}
                  </td>
                </tr>
              ) : (
                currentStaff.map(staffMember => {
                  const paymentStatus = getPaymentStatus(staffMember, selectedYear, selectedMonth);
                  const isPaid = paymentStatus.status === 'Paid';
                  const lastPayment = getLastPaymentDate(staffMember);
                  
                  return (
                    <tr key={staffMember._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`w-4 h-4 rounded-full mx-auto ${
                          isPaid ? 'bg-green-500' : 'bg-yellow-500'
                        }`} title={isPaid ? 'Paid' : 'Pending'}></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {staffMember.firstName} {staffMember.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {staffMember.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        KSh {(staffMember.salary?.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {lastPayment 
                          ? new Date(lastPayment).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          {isPaid ? (
                            <>
                              <button
                                onClick={() => handleMarkPaid('staff', staffMember._id, `${staffMember.firstName} ${staffMember.lastName}`)}
                                disabled={true}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium cursor-not-allowed"
                              >
                                Paid ✓
                              </button>
                              <button
                                onClick={() => handleUndoPayment('staff', staffMember._id, `${staffMember.firstName} ${staffMember.lastName}`)}
                                disabled={isProcessing}
                                className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                                title="Click to undo payment"
                              >
                                Undo
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleMarkPaid('staff', staffMember._id, `${staffMember.firstName} ${staffMember.lastName}`)}
                              disabled={isProcessing}
                              className="px-3 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* NEW: Staff Pagination */}
        {filteredStaff.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{staffIndexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(staffIndexOfLastItem, filteredStaff.length)}
                </span>{' '}
                of <span className="font-medium">{filteredStaff.length}</span> staff members
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Per page:</span>
                  <select
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    value={staffItemsPerPage}
                    onChange={(e) => {
                      setStaffItemsPerPage(Number(e.target.value));
                      setStaffCurrentPage(1);
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
                    onClick={() => setStaffCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={staffCurrentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm ${
                      staffCurrentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {[...Array(staffTotalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    // Show first, last, and pages around current
                    if (
                      pageNumber === 1 ||
                      pageNumber === staffTotalPages ||
                      (pageNumber >= staffCurrentPage - 1 && pageNumber <= staffCurrentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setStaffCurrentPage(pageNumber)}
                          className={`px-3 py-1 rounded-md text-sm ${
                            staffCurrentPage === pageNumber
                              ? 'bg-maroon text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      pageNumber === staffCurrentPage - 2 ||
                      pageNumber === staffCurrentPage + 2
                    ) {
                      return <span key={pageNumber} className="px-1 text-gray-500">...</span>;
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => setStaffCurrentPage(prev => Math.min(staffTotalPages, prev + 1))}
                    disabled={staffCurrentPage === staffTotalPages}
                    className={`px-3 py-1 rounded-md text-sm ${
                      staffCurrentPage === staffTotalPages
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

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-700">Paid for selected month</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-700">Pending payment</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-700">Undo payment (click red button)</span>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <p> <strong>Search:</strong> Use the search bars above each table to find specific staff members.</p>
          <p className="mt-1"> <strong>Undo Mistake:</strong> Click the red "Undo" button next to any paid staff to reverse their payment for that month.</p>
        </div>
      </div>
    </div>
  );
};

export default Payroll;