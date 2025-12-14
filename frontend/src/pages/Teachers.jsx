import React, { useState, useEffect } from 'react';
import { teachersAPI } from '../services/api';

// Simple Toast Component for Teachers page (same as Fees page)
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

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  
  // NEW: Toast state
  const [toast, setToast] = useState(null);
  
  // NEW: Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    primaryGradeAssigned: 'Day Care',
    additionalGrades: [],
    isActive: true
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Filter teachers when search term or status filter changes
  useEffect(() => {
    let result = teachers;
    
    // Apply status filter
    if (statusFilter === 'active') {
      result = result.filter(teacher => teacher.isActive !== false);
    } else if (statusFilter === 'inactive') {
      result = result.filter(teacher => teacher.isActive === false);
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(teacher =>
        teacher.firstName.toLowerCase().includes(searchLower) ||
        teacher.lastName.toLowerCase().includes(searchLower) ||
        teacher.email.toLowerCase().includes(searchLower) ||
        (teacher.primaryGradeAssigned && teacher.primaryGradeAssigned.toLowerCase().includes(searchLower)) ||
        (teacher.additionalGrades && teacher.additionalGrades.some(grade => 
          grade.toLowerCase().includes(searchLower)
        ))
      );
    }
    
    setFilteredTeachers(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [teachers, searchTerm, statusFilter]);

  const fetchTeachers = async () => {
    try {
      const response = await teachersAPI.getAll();
      setTeachers(response.data.teachers || []);
      setFilteredTeachers(response.data.teachers || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      showToast('Error loading teachers: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTeacher = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await teachersAPI.update(editingTeacher._id, formData);
        showToast('Teacher updated successfully!');
      } else {
        await teachersAPI.create(formData);
        showToast('Teacher added successfully!');
      }
      
      resetForm();
      fetchTeachers();
    } catch (error) {
      showToast('Error: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone,
      primaryGradeAssigned: teacher.primaryGradeAssigned || 'Day Care',
      additionalGrades: teacher.additionalGrades || [],
      isActive: teacher.isActive !== false
    });
    setShowTeacherForm(true);
  };

  const handleDeleteTeacher = async (teacherId) => {
    const teacher = teachers.find(t => t._id === teacherId);
    if (!teacher) {
      showToast('Teacher not found!', 'error');
      return;
    }

    const confirmMessage = `⚠️ PERMANENT DELETE CONFIRMATION\n\nTeacher: ${teacher.firstName} ${teacher.lastName}\nEmail: ${teacher.email}\nPrimary Grade: ${teacher.primaryGradeAssigned}\n\n❌ This action will:\n• Permanently delete this teacher from the database\n• Cannot be undone\n• All records will be lost\n\nAre you ABSOLUTELY sure you want to delete?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await teachersAPI.delete(teacherId);
        showToast('✅ Teacher permanently deleted from database!');
        fetchTeachers();
      } catch (error) {
        showToast('Error deleting teacher: ' + (error.response?.data?.message || error.message), 'error');
      }
    }
  };

  const handleToggleStatus = async (teacher) => {
    const newStatus = !teacher.isActive;
    const confirmMessage = newStatus 
      ? `Activate ${teacher.firstName} ${teacher.lastName}?`
      : `Deactivate ${teacher.firstName} ${teacher.lastName}? This will hide them from assignments.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await teachersAPI.update(teacher._id, { isActive: newStatus });
        
        if (newStatus) {
          showToast(`✅ Teacher activated successfully!`);
        } else {
          showToast(`✅ Teacher deactivated successfully!`);
        }
        
        fetchTeachers();
      } catch (error) {
        showToast('Error updating status: ' + (error.response?.data?.message || error.message), 'error');
      }
    }
  };

  const resetForm = () => {
    setShowTeacherForm(false);
    setEditingTeacher(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      primaryGradeAssigned: 'Day Care',
      additionalGrades: [],
      isActive: true
    });
  };

  // NEW: Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTeachers = filteredTeachers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);

  // NEW: Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Statistics - FIXED: Use primaryGradeAssigned instead of gradeAssigned
  const activeCount = teachers.filter(t => t.isActive !== false).length;
  const inactiveCount = teachers.filter(t => t.isActive === false).length;
  
  // Count teachers by level - FIXED (BUT NEEDS UPDATE FOR MULTIPLE GRADES)
  const primaryTeachersCount = teachers.filter(t => 
    t.isActive !== false && (
      (t.primaryGradeAssigned && t.primaryGradeAssigned.includes('Grade')) ||
      (t.additionalGrades && t.additionalGrades.some(grade => grade.includes('Grade')))
    )
  ).length;
  
  const prePrimaryTeachersCount = teachers.filter(t => 
    t.isActive !== false && (
      (t.primaryGradeAssigned && (
        t.primaryGradeAssigned.includes('PP') || 
        t.primaryGradeAssigned === 'Playgroup' || 
        t.primaryGradeAssigned === 'Day Care'
      )) ||
      (t.additionalGrades && t.additionalGrades.some(grade => 
        grade.includes('PP') || grade === 'Playgroup' || grade === 'Day Care'
      ))
    )
  ).length;

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

      {/* Header Section */}
      <div className="bg-gradient-to-r from-maroon to-dark-maroon rounded-2xl shadow-xl p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-black">Teachers Management</h1>
            <p className="text-gold mt-2">Manage teaching staff and class assignments</p>
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-right">
            <p className="text-2xl font-bold text-black">{teachers.length}</p>
            <p className="text-sm text-gold">Total Teachers</p>
          </div>
        </div>
      </div>

      {/* Quick Stats - UPDATED FOR MULTIPLE GRADES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Teachers Card */}
        <div className="bg-white rounded-lg shadow p-4 text-center border-l-4 border-green-500">
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          <p className="text-gray-600 text-sm">Active Teachers</p>
        </div>

        {/* Inactive Teachers Card */}
        <div className="bg-white rounded-lg shadow p-4 text-center border-l-4 border-gray-400">
          <p className="text-2xl font-bold text-gray-600">{inactiveCount}</p>
          <p className="text-gray-600 text-sm">Inactive Teachers</p>
        </div>

        {/* Primary Teachers Card */}
        <div className="bg-white rounded-lg shadow p-4 text-center border-l-4 border-blue-500">
          <p className="text-2xl font-bold text-blue-600">{primaryTeachersCount}</p>
          <p className="text-gray-600 text-sm">Primary Teachers</p>
          <p className="text-xs text-gray-500 mt-1">(Grades 1-4)</p>
        </div>

        {/* Pre-Primary Teachers Card */}
        <div className="bg-white rounded-lg shadow p-4 text-center border-l-4 border-green-500">
          <p className="text-2xl font-bold text-green-600">{prePrimaryTeachersCount}</p>
          <p className="text-gray-600 text-sm">Pre-Primary Teachers</p>
          <p className="text-xs text-gray-500 mt-1">(Day Care - PP2)</p>
        </div>
      </div>

      {/* Action Bar with Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <h2 className="text-xl font-semibold text-gray-800">Teaching Staff</h2>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              <select
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Teachers ({teachers.length})</option>
                <option value="active">Active Only ({activeCount})</option>
                <option value="inactive">Inactive Only ({inactiveCount})</option>
              </select>
            </div>

            {/* Add Teacher Button */}
            <button 
              className="bg-maroon text-white px-4 py-2 rounded-lg hover:bg-dark-maroon transition-colors flex items-center"
              onClick={() => setShowTeacherForm(true)}
            >
              <span className="mr-2">+</span> Add Teacher
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search teachers by name, email, or grade..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Teacher Form Modal */}
      {showTeacherForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-maroon">
              {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
            </h2>
            <form onSubmit={handleSubmitTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="teacher@awinja.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+254700000000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Grade Assigned *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.primaryGradeAssigned}
                  onChange={(e) => setFormData({...formData, primaryGradeAssigned: e.target.value})}
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Grades (Optional)
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {['Day Care', 'Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4']
                      .filter(grade => grade !== formData.primaryGradeAssigned)
                      .map(grade => (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => {
                            if (formData.additionalGrades.includes(grade)) {
                              setFormData({
                                ...formData,
                                additionalGrades: formData.additionalGrades.filter(g => g !== grade)
                              });
                            } else {
                              setFormData({
                                ...formData,
                                additionalGrades: [...formData.additionalGrades, grade]
                              });
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            formData.additionalGrades.includes(grade)
                              ? 'bg-maroon text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {grade} {formData.additionalGrades.includes(grade) ? '✓' : '+'}
                        </button>
                      ))
                    }
                  </div>
                  {formData.additionalGrades.length > 0 ? (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Selected additional grades:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.additionalGrades.map(grade => (
                          <span
                            key={grade}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            {grade}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Select grades this teacher also teaches</p>
                  )}
                </div>
              </div>

              {editingTeacher && (
                <div className="md:col-span-2">
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

              <div className="md:col-span-2 flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-maroon text-white py-2 rounded-lg hover:bg-dark-maroon transition-colors"
                >
                  {editingTeacher ? 'Update Teacher' : 'Add Teacher'}
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

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Teacher Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Grades Assigned</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTeachers.map((teacher) => (
                <tr key={teacher._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-maroon rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {teacher.firstName?.charAt(0)}{teacher.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{teacher.firstName} {teacher.lastName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="space-y-1">
                      {/* Primary Grade */}
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          teacher.primaryGradeAssigned?.includes('Grade') ? 'bg-blue-100 text-blue-800' :
                          teacher.primaryGradeAssigned?.includes('PP') ? 'bg-green-100 text-green-800' :
                          teacher.primaryGradeAssigned === 'Playgroup' ? 'bg-purple-100 text-purple-800' :
                          teacher.primaryGradeAssigned === 'Day Care' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {teacher.primaryGradeAssigned || 'Not assigned'} (Primary)
                        </span>
                      </div>
                      
                      {/* Additional Grades */}
                      {teacher.additionalGrades && teacher.additionalGrades.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {teacher.additionalGrades.map(grade => (
                            <span
                              key={grade}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                              title={`Also teaches ${grade}`}
                            >
                              {grade}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleToggleStatus(teacher)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        teacher.isActive !== false 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {teacher.isActive !== false ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditTeacher(teacher)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher._id)}
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
        
        {filteredTeachers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">👨‍🏫</div>
            <p className="text-lg mb-2">No teachers found</p>
            {statusFilter === 'inactive' && inactiveCount === 0 ? (
              <p className="text-sm">No inactive teachers found. Deactivate a teacher first.</p>
            ) : (
              <p className="text-sm">Try adjusting your search terms or filters</p>
            )}
          </div>
        ) : (
          // NEW: Pagination Controls (Same as Students/Fees pages)
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredTeachers.length)}
                </span>{' '}
                of <span className="font-medium">{filteredTeachers.length}</span> teachers
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Teachers per page:</span>
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

      {/* Updated Summary Footer with Pagination Info */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Showing {currentTeachers.length} of {filteredTeachers.length} teachers (Page {currentPage} of {totalPages}) • 
            <span className="ml-2">
              <span className="text-green-600 font-medium">{activeCount} active</span>
              {inactiveCount > 0 && <span className="ml-2 text-gray-600">{inactiveCount} inactive</span>}
            </span>
          </span>
          <div className="flex space-x-2">
            <span className="text-sm font-medium text-maroon">
              Total: {teachers.length} teachers
            </span>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Show All
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Teachers;