import React, { useState, useEffect } from 'react';
import { studentsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    admissionNumber: '',
    firstName: '',
    lastName: '',
    grade: 'PP1',
    gender: 'Male',
    parentName: '',
    parentPhone: '+254700000000',
    knecCode: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.getAll();
      setStudents(response.data.students);
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
      knecCode: student.knecCode || ''
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

  const resetForm = () => {
    setShowStudentForm(false);
    setEditingStudent(null);
    setFormData({
      admissionNumber: '',
      firstName: '',
      lastName: '',
      grade: 'PP1',
      gender: 'Male',
      parentName: '',
      parentPhone: '+254700000000',
      knecCode: ''
    });
  };

  const generateAdmissionNumber = () => {
    const lastStudent = students[students.length - 1];
    if (lastStudent && lastStudent.admissionNumber) {
      const match = lastStudent.admissionNumber.match(/AEC\/(\d+)\/2025/);
      if (match) {
        const lastNumber = parseInt(match[1]);
        return `AEC/${String(lastNumber + 1).padStart(3, '0')}/2025`;
      }
    }
    return `AEC/${String(students.length + 1).padStart(3, '0')}/2025`;
  };

  const filteredStudents = students.filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-maroon">{students.filter(s => s.grade.includes('Grade')).length}</p>
          <p className="text-gray-600 text-sm">Primary Students</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{students.filter(s => s.grade.includes('PP')).length}</p>
          <p className="text-gray-600 text-sm">Pre-Primary</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{students.filter(s => s.gender === 'Male').length}</p>
          <p className="text-gray-600 text-sm">Male Students</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-pink-600">{students.filter(s => s.gender === 'Female').length}</p>
          <p className="text-gray-600 text-sm">Female Students</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold text-gray-800">Student Records</h2>
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
                  placeholder="e.g., AEC/001/2025"
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

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search students by name or admission number..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

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
            <div className="text-6xl mb-4">👨‍🎓</div>
            <p className="text-lg mb-2">No students found</p>
            <p className="text-sm">Try adjusting your search terms</p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Showing {filteredStudents.length} of {students.length} students
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