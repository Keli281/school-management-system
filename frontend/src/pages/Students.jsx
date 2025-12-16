import React, { useState, useEffect } from 'react';
import { studentsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Simple Toast Component for Students page (same as Teachers/Fees pages)
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

const Students = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  
  // Toast state
  const [toast, setToast] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    admissionNumber: '',
    firstName: '',
    lastName: '',
    grade: 'Day Care',
    gender: 'Male',
    parentName: '',
    parentPhone: '+254700000000',
    knecCode: '',
    admissionFee: {
      paid: false,
      amount: 0,
      paymentDate: '',
      academicYear: '2026'
    },
    dateOfAdmission: new Date().toISOString().split('T')[0],
    isActive: true
  });

  // NEW: State to prevent double submissions
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    let result = students;
    
    if (statusFilter === 'active') {
      result = result.filter(student => student.isActive !== false);
    } else if (statusFilter === 'inactive') {
      result = result.filter(student => student.isActive === false);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(student =>
        student.firstName.toLowerCase().includes(searchLower) ||
        student.lastName.toLowerCase().includes(searchLower) ||
        student.admissionNumber.toLowerCase().includes(searchLower) ||
        student.grade.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredStudents(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [students, searchTerm, statusFilter]);

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.getAll();
      setStudents(response.data.students);
      setFilteredStudents(response.data.students);
    } catch (error) {
      console.error('Error fetching students:', error);
      showToast('Error loading students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStudent = async (e) => {
    e.preventDefault();
    // NEW: Prevent double submission
    if (isSaving) return;
    
    setIsSaving(true); // NEW: Disable button
    try {
      if (editingStudent) {
        await studentsAPI.update(editingStudent._id, formData);
        showToast('Student updated successfully!');
      } else {
        await studentsAPI.create(formData);
        showToast('Student added successfully!');
      }
      
      resetForm();
      fetchStudents();
    } catch (error) {
      showToast('Error: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setIsSaving(false); // NEW: Re-enable button
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setFormData({
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade,
      gender: student.gender,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      knecCode: student.knecCode || '',
      admissionFee: student.admissionFee || {
        paid: false,
        amount: 0,
        paymentDate: '',
        academicYear: '2026'
      },
      dateOfAdmission: student.dateOfAdmission ? 
        new Date(student.dateOfAdmission).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0],
      isActive: student.isActive !== false
    });
    setShowStudentForm(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        await studentsAPI.delete(studentId);
        showToast('Student deleted successfully!');
        fetchStudents();
      } catch (error) {
        showToast('Error deleting student: ' + (error.response?.data?.message || error.message), 'error');
      }
    }
  };

  const handleToggleStatus = async (student) => {
    const newStatus = !student.isActive;
    const confirmMessage = newStatus 
      ? `Activate ${student.firstName} ${student.lastName}?`
      : `Deactivate ${student.firstName} ${student.lastName}? This will hide them from fee recording.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await studentsAPI.update(student._id, { isActive: newStatus });
        showToast(`Student ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        fetchStudents();
      } catch (error) {
        showToast('Error updating status: ' + (error.response?.data?.message || error.message), 'error');
      }
    }
  };

  const resetForm = () => {
    setShowStudentForm(false);
    setEditingStudent(null);
    setFormData({
      admissionNumber: '',
      firstName: '',
      lastName: '',
      grade: 'Day Care',
      gender: 'Male',
      parentName: '',
      parentPhone: '+254700000000',
      knecCode: '',
      admissionFee: {
        paid: false,
        amount: 0,
        paymentDate: '',
        academicYear: '2026'
      },
      dateOfAdmission: new Date().toISOString().split('T')[0],
      isActive: true
    });
    setIsSaving(false); // NEW: Reset saving state
  };

  const generateAdmissionNumber = () => {
    const lastStudent = students[students.length - 1];
    const admissionYear = '2026';
    
    if (lastStudent && lastStudent.admissionNumber) {
      const match = lastStudent.admissionNumber.match(/AEC\/(\d+)\/(\d{4})/);
      if (match) {
        const lastNumber = parseInt(match[1]);
        const lastYear = match[2];
        
        if (lastYear === admissionYear) {
          return `AEC/${String(lastNumber + 1).padStart(3, '0')}/${admissionYear}`;
        } else {
          return `AEC/001/${admissionYear}`;
        }
      }
    }
    return `AEC/001/${admissionYear}`;
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const activeStudents = students.filter(s => s.isActive !== false);
  const gradeCounts = activeStudents.reduce((acc, student) => {
    acc[student.grade] = (acc[student.grade] || 0) + 1;
    return acc;
  }, {});

  const grades = ['Day Care', 'Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];

  const activeCount = students.filter(s => s.isActive !== false).length;
  const inactiveCount = students.filter(s => s.isActive === false).length;

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

      <div className="bg-gradient-to-r from-maroon to-dark-maroon rounded-2xl shadow-xl p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-black">Students Management</h1>
            <p className="text-gold mt-2">Manage student records and information</p>
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-right">
            <p className="text-2xl font-bold text-black">{students.length}</p>
            <p className="text-sm text-gold">Total Students</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Students</h3>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600">{activeCount}</p>
            <p className="text-sm text-gray-600 mt-2">Currently Enrolled</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-gray-400">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Inactive Students</h3>
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-600">{inactiveCount}</p>
            <p className="text-sm text-gray-600 mt-2">Transferred/Alumni</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Gender Distribution</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-male text-blue-600 text-xl"></i>
              </div>
              <p className="text-xl font-bold text-blue-600">{activeStudents.filter(s => s.gender === 'Male').length}</p>
              <p className="text-xs text-gray-600">Male</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="fas fa-female text-pink-600 text-xl"></i>
              </div>
              <p className="text-xl font-bold text-pink-600">{activeStudents.filter(s => s.gender === 'Female').length}</p>
              <p className="text-xs text-gray-600">Female</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Active by Grade</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {grades.map(grade => (
              <div key={grade} className="text-center">
                <p className="text-lg font-bold text-purple-600">{gradeCounts[grade] || 0}</p>
                <p className="text-xs text-gray-600 truncate" title={grade}>
                  {grade === 'Day Care' ? 'DC' : grade.replace('Grade', 'G')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <h2 className="text-xl font-semibold text-gray-800">Student Records</h2>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              <select
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Students</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <button 
              className="bg-maroon text-white px-4 py-2 rounded-lg hover:bg-dark-maroon transition-colors flex items-center"
              onClick={() => {
                setFormData({
                  ...formData,
                  admissionNumber: generateAdmissionNumber()
                });
                setShowStudentForm(true);
              }}
            >
              <span className="mr-2">+</span> Add Student
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search students by name, admission number, or grade..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {showStudentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-maroon">
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </h2>
            <form onSubmit={handleSubmitStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Admission Number *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.admissionNumber}
                  onChange={(e) => setFormData({...formData, admissionNumber: e.target.value})}
                  placeholder="e.g., AEC/001/2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  placeholder="First name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  placeholder="Last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                >
                  <option value="Day Care">Day Care</option>
                  <option value="Playgroup">Playgroup</option>
                  <option value="PP1">PP1</option>
                  <option value="PP2">PP2</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {editingStudent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                    value={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.parentName}
                  onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                  placeholder="Parent/Guardian name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
                  placeholder="+254700000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KNEC Code (Optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.knecCode}
                  onChange={(e) => setFormData({...formData, knecCode: e.target.value})}
                  placeholder="Leave empty if not available"
                />
              </div>

              {(() => {
                const admissionYear = formData.admissionNumber.match(/\/(\d{4})$/);
                const is2026OrLater = admissionYear && parseInt(admissionYear[1]) >= 2026;
                
                if (!is2026OrLater && !editingStudent) {
                  return null;
                }
                
                return (
                  <>
                    <div className="md:col-span-2 border-t pt-4 mt-2">
                      <h3 className="text-lg font-medium text-maroon mb-3">Admission Fee Status {!is2026OrLater && '(Historical)'}</h3>
                      
                      {!is2026OrLater && editingStudent && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Note:</span> Admission fee tracking is only applicable for students admitted in 2026 and later.
                            This student was admitted in {admissionYear ? admissionYear[1] : 'previous year'}.
                          </p>
                        </div>
                      )}
                      
                      {is2026OrLater && (
                        <>
                          <div className="mb-4">
                            <label className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-maroon border-gray-300 rounded focus:ring-maroon focus:ring-2"
                                checked={formData.admissionFee.paid}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  admissionFee: {
                                    ...formData.admissionFee,
                                    paid: e.target.checked,
                                    paymentDate: e.target.checked ? new Date().toISOString().split('T')[0] : ''
                                  }
                                })}
                              />
                              <span className="text-sm font-medium text-gray-700">
                                Admission Fee Paid
                              </span>
                            </label>
                            <p className="text-xs text-gray-500 mt-1 ml-7">
                              Check if admission fee has been paid (Only applicable for 2026+ admissions)
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Admission Fee Amount (KSh)
                              </label>
                              <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                                value={formData.admissionFee.amount}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  admissionFee: {
                                    ...formData.admissionFee,
                                    amount: parseInt(e.target.value) || 0
                                  }
                                })}
                                placeholder="5000"
                              />
                            </div>

                            {formData.admissionFee.paid && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Payment Date
                                </label>
                                <input
                                  type="date"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                                  value={formData.admissionFee.paymentDate || new Date().toISOString().split('T')[0]}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    admissionFee: {
                                      ...formData.admissionFee,
                                      paymentDate: e.target.value
                                    }
                                  })}
                                />
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Admission *
                      </label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                        value={formData.dateOfAdmission}
                        onChange={(e) => setFormData({...formData, dateOfAdmission: e.target.value})}
                      />
                    </div>
                  </>
                );
              })()}

              <div className="md:col-span-2 flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    isSaving 
                      ? 'bg-gray-400 cursor-not-allowed text-white' 
                      : 'bg-maroon hover:bg-dark-maroon text-white'
                  }`}
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {editingStudent ? 'Updating...' : 'Adding...'}
                    </span>
                  ) : (
                    editingStudent ? 'Update Student' : 'Add Student'
                  )}
                </button>
                <button
                  type="button"
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={resetForm}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Admission No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Admission Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Parent Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentStudents.map((student) => (
                <tr 
                  key={student._id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/student/${encodeURIComponent(student.admissionNumber)}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.admissionNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.firstName} {student.lastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.grade.includes('Grade') ? 'bg-blue-100 text-blue-800' :
                      student.grade.includes('PP') ? 'bg-green-100 text-green-800' :
                      student.grade === 'Day Care' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {student.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                    }`}>
                      {student.gender}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(() => {
                      const admissionYear = student.admissionNumber.match(/\/(\d{4})$/);
                      const is2026OrLater = admissionYear && parseInt(admissionYear[1]) >= 2026;
                      
                      if (!is2026OrLater) {
                        return (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs" title="Not applicable for pre-2026 students">
                            N/A
                          </span>
                        );
                      }
                      
                      const fee = student.admissionFee || { paid: false, amount: 0 };
                      
                      if (fee.paid) {
                        return (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                            Paid: KSh {fee.amount?.toLocaleString() || '0'}
                          </span>
                        );
                      } else {
                        return (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                            Pending
                          </span>
                        );
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(student);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        student.isActive !== false 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {student.isActive !== false ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.parentPhone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditStudent(student);
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStudent(student._id);
                        }}
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
      

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <i className="fas fa-user-graduate text-gray-300 text-6xl mb-4"></i>
            <p className="text-lg mb-2">No students found</p>
            <p className="text-sm">Try adjusting your search terms or filters</p>
          </div>
        ) : (
          // Fixed Pagination Controls
          <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-700 text-center sm:text-left">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredStudents.length)}
                </span>{' '}
                of <span className="font-medium">{filteredStudents.length}</span> students
              </div>
              
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Students per page:</span>
                  <select
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-maroon"
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
                    className={`px-3 py-1.5 rounded-md text-sm ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-1.5 rounded-md text-sm ${
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
                    className={`px-3 py-1.5 rounded-md text-sm ${
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

      {/* Updated Summary Footer with Pagination Info */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Showing {currentStudents.length} of {filteredStudents.length} students (Page {currentPage} of {totalPages}) • 
            <span className="ml-2">
              <span className="text-green-600 font-medium">{activeCount} active</span>
              {inactiveCount > 0 && <span className="ml-2 text-gray-600">{inactiveCount} inactive</span>}
            </span>
          </span>
          <span className="text-sm font-medium text-maroon">
            Total: {students.length} students
          </span>
        </div>
      </div>
    </div>
  );
};

export default Students;