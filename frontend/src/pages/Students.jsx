import React, { useState, useEffect } from 'react';
import { studentsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    admissionNumber: '',
    firstName: '',
    lastName: '',
    grade: 'Day Care',
    gender: 'Male',
    parentName: '',
    parentPhone: '+254700000000',
    knecCode: '',
    isActive: true
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students when search term or status filter changes
  useEffect(() => {
    let result = students;
    
    // Apply status filter
    if (statusFilter === 'active') {
      result = result.filter(student => student.isActive !== false);
    } else if (statusFilter === 'inactive') {
      result = result.filter(student => student.isActive === false);
    }
    
    // Apply search filter
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
  }, [students, searchTerm, statusFilter]);

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.getAll();
      setStudents(response.data.students);
      setFilteredStudents(response.data.students); // Initialize filtered list
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStudent = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await studentsAPI.update(editingStudent._id, formData);
        alert('Student updated successfully!');
      } else {
        await studentsAPI.create(formData);
        alert('Student added successfully!');
      }
      
      resetForm();
      fetchStudents();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
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
      isActive: student.isActive !== false // Ensure boolean
    });
    setShowStudentForm(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        await studentsAPI.delete(studentId);
        alert('Student deleted successfully!');
        fetchStudents();
      } catch (error) {
        alert('Error deleting student: ' + (error.response?.data?.message || error.message));
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
        alert(`Student ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        fetchStudents();
      } catch (error) {
        alert('Error updating status: ' + (error.response?.data?.message || error.message));
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
      isActive: true
    });
  };

  const generateAdmissionNumber = () => {
    const lastStudent = students[students.length - 1];
    const admissionYear = '2026'; // Default to 2026 for Day Care
    
    if (lastStudent && lastStudent.admissionNumber) {
      const match = lastStudent.admissionNumber.match(/AEC\/(\d+)\/(\d{4})/);
      if (match) {
        const lastNumber = parseInt(match[1]);
        const lastYear = match[2];
        
        if (lastYear === admissionYear) {
          // Increment within same year
          return `AEC/${String(lastNumber + 1).padStart(3, '0')}/${admissionYear}`;
        } else {
          // Start from 001 for new year
          return `AEC/001/${admissionYear}`;
        }
      }
    }
    return `AEC/001/${admissionYear}`;
  };

  // Calculate students per grade (only active)
  const activeStudents = students.filter(s => s.isActive !== false);
  const gradeCounts = activeStudents.reduce((acc, student) => {
    acc[student.grade] = (acc[student.grade] || 0) + 1;
    return acc;
  }, {});

  const grades = ['Day Care', 'Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];

  // Statistics
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
      {/* Header Section */}
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

      {/* Quick Stats - IMPROVED WITH STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Students Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Students</h3>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600">{activeCount}</p>
            <p className="text-sm text-gray-600 mt-2">Currently Enrolled</p>
          </div>
        </div>

        {/* Inactive Students Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-gray-400">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Inactive Students</h3>
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-600">{inactiveCount}</p>
            <p className="text-sm text-gray-600 mt-2">Transferred/Alumni</p>
          </div>
        </div>

        {/* Gender Distribution Card */}
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

        {/* Students by Grade Card */}
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

      {/* Action Bar with Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <h2 className="text-xl font-semibold text-gray-800">Student Records</h2>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            {/* Status Filter */}
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

            {/* Add Student Button */}
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

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search students by name, admission number, or grade..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Student Form Modal */}
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

              {/* Status Field (only for editing) */}
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

              <div className="md:col-span-2 flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-maroon text-white py-2 rounded-lg hover:bg-dark-maroon transition-colors"
                >
                  {editingStudent ? 'Update Student' : 'Add Student'}
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

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Admission No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Parent Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
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
        
        {filteredStudents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <i className="fas fa-user-graduate text-gray-300 text-6xl mb-4"></i>
            <p className="text-lg mb-2">No students found</p>
            <p className="text-sm">Try adjusting your search terms or filters</p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Showing {filteredStudents.length} of {students.length} students • 
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