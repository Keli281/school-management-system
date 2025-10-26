import React, { useState, useEffect } from 'react';
import { teachersAPI } from '../services/api';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gradeAssigned: 'PP1'
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await teachersAPI.getAll();
      setTeachers(response.data.teachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      alert('Error loading teachers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTeacher = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await teachersAPI.update(editingTeacher._id, formData);
        alert('Teacher updated successfully!');
      } else {
        await teachersAPI.create(formData);
        alert('Teacher added successfully!');
      }
      
      resetForm();
      fetchTeachers();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone,
      gradeAssigned: teacher.gradeAssigned
    });
    setShowTeacherForm(true);
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (window.confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
      try {
        await teachersAPI.delete(teacherId);
        alert('Teacher deleted successfully!');
        fetchTeachers();
      } catch (error) {
        alert('Error deleting teacher: ' + (error.response?.data?.message || error.message));
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
      gradeAssigned: 'PP1'
    });
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.gradeAssigned.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-3xl font-bold text-black">Teachers Management</h1>
            <p className="text-gold mt-2">Manage teaching staff and class assignments</p>
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-right">
            <p className="text-2xl font-bold text-black">{teachers.length}</p>
            <p className="text-sm text-gold">Total Teachers</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-maroon">
            {teachers.filter(t => t.gradeAssigned.includes('Grade')).length}
          </p>
          <p className="text-gray-600 text-sm">Primary Teachers</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {teachers.filter(t => t.gradeAssigned.includes('PP')).length}
          </p>
          <p className="text-gray-600 text-sm">Pre-Primary</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {teachers.filter(t => t.gradeAssigned === 'Playgroup').length}
          </p>
          <p className="text-gray-600 text-sm">Playgroup</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">
            {teachers.filter(t => t.gradeAssigned === 'None').length}
          </p>
          <p className="text-gray-600 text-sm">Unassigned</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold text-gray-800">Teaching Staff</h2>
        <button 
          className="bg-maroon text-white px-4 py-2 rounded-lg hover:bg-dark-maroon transition-colors flex items-center"
          onClick={() => setShowTeacherForm(true)}
        >
          <span className="mr-2">+</span> Add Teacher
        </button>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Assigned *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.gradeAssigned}
                  onChange={(e) => setFormData({...formData, gradeAssigned: e.target.value})}
                >
                  <option value="Playgroup">Playgroup</option>
                  <option value="PP1">PP1</option>
                  <option value="PP2">PP2</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="None">Not Assigned</option>
                </select>
              </div>

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

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Teacher Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Grade Assigned</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-maroon rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{teacher.firstName} {teacher.lastName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      teacher.gradeAssigned.includes('Grade') ? 'bg-blue-100 text-blue-800' :
                      teacher.gradeAssigned.includes('PP') ? 'bg-green-100 text-green-800' :
                      teacher.gradeAssigned === 'Playgroup' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {teacher.gradeAssigned}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      teacher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {teacher.isActive ? 'Active' : 'Inactive'}
                    </span>
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
        
        {filteredTeachers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">👨‍🏫</div>
            <p className="text-lg mb-2">No teachers found</p>
            <p className="text-sm">Try adjusting your search terms or add a new teacher</p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Showing {filteredTeachers.length} of {teachers.length} teachers
          </span>
          <span className="text-sm font-medium text-maroon">
            Total: {teachers.length} teaching staff
          </span>
        </div>
      </div>
    </div>
  );
};

export default Teachers;