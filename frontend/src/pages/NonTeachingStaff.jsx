import React, { useState, useEffect } from 'react';
import { nonTeachingStaffAPI } from '../services/api';

// Simple Toast Component (same as other pages)
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

const NonTeachingStaff = () => {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '+254700000000',
    role: 'Driver',
    employmentDate: new Date().toISOString().split('T')[0],
    salary: {
      amount: 0,
      currency: 'KSh',
      paymentFrequency: 'Monthly'
    },
    notes: '',
    isActive: true
  });

  const [isSaving, setIsSaving] = useState(false); // NEW: For disabling save button

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const roles = ['Driver', 'Gardener', 'Cleaner', 'Cook', 'Security', 'Other'];
  const paymentFrequencies = ['Monthly', 'Weekly', 'Daily', 'Other'];

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    let result = staff;
    
    // Apply status filter
    if (statusFilter === 'active') {
      result = result.filter(staff => staff.isActive !== false);
    } else if (statusFilter === 'inactive') {
      result = result.filter(staff => staff.isActive === false);
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(staff => staff.role === roleFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(staff =>
        staff.firstName.toLowerCase().includes(searchLower) ||
        staff.lastName.toLowerCase().includes(searchLower) ||
        staff.email.toLowerCase().includes(searchLower) ||
        staff.role.toLowerCase().includes(searchLower) ||
        (staff.notes && staff.notes.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredStaff(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [staff, searchTerm, statusFilter, roleFilter]);

  const fetchStaff = async () => {
    try {
      const response = await nonTeachingStaffAPI.getAll();
      setStaff(response.data.staff || []);
      setFilteredStaff(response.data.staff || []);
    } catch (error) {
      console.error('Error fetching non-teaching staff:', error);
      showToast('Error loading staff: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStaff = async (e) => {
    e.preventDefault();
    if (isSaving) return; // Prevent double submission
    
    setIsSaving(true); // Disable save button
    try {
      if (editingStaff) {
        await nonTeachingStaffAPI.update(editingStaff._id, formData);
        showToast('Staff member updated successfully!');
      } else {
        await nonTeachingStaffAPI.create(formData);
        showToast('Staff member added successfully!');
      }
      
      resetForm();
      fetchStaff();
    } catch (error) {
      showToast('Error: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setIsSaving(false); // Re-enable save button
    }
  };

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role,
      employmentDate: staffMember.employmentDate ? 
        new Date(staffMember.employmentDate).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0],
      salary: staffMember.salary || {
        amount: 0,
        currency: 'KSh',
        paymentFrequency: 'Monthly'
      },
      notes: staffMember.notes || '',
      isActive: staffMember.isActive !== false
    });
    setShowStaffForm(true);
  };

  const handleDeleteStaff = async (staffId) => {
    const staffMember = staff.find(s => s._id === staffId);
    if (!staffMember) {
      showToast('Staff member not found!', 'error');
      return;
    }

    const confirmMessage = `⚠️ PERMANENT DELETE CONFIRMATION\n\nStaff: ${staffMember.firstName} ${staffMember.lastName}\nRole: ${staffMember.role}\n\n❌ This action will:\n• Permanently delete this staff member from the database\n• Cannot be undone\n• All records will be lost\n\nAre you ABSOLUTELY sure you want to delete?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await nonTeachingStaffAPI.delete(staffId);
        showToast('✅ Staff member permanently deleted from database!');
        fetchStaff();
      } catch (error) {
        showToast('Error deleting staff: ' + (error.response?.data?.message || error.message), 'error');
      }
    }
  };

  const handleToggleStatus = async (staffMember) => {
    const newStatus = !staffMember.isActive;
    const confirmMessage = newStatus 
      ? `Activate ${staffMember.firstName} ${staffMember.lastName}?`
      : `Deactivate ${staffMember.firstName} ${staffMember.lastName}? This will hide them from assignments.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await nonTeachingStaffAPI.update(staffMember._id, { isActive: newStatus });
        
        if (newStatus) {
          showToast(`✅ Staff member activated successfully!`);
        } else {
          showToast(`✅ Staff member deactivated successfully!`);
        }
        
        fetchStaff();
      } catch (error) {
        showToast('Error updating status: ' + (error.response?.data?.message || error.message), 'error');
      }
    }
  };

  const resetForm = () => {
    setShowStaffForm(false);
    setEditingStaff(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '+254700000000',
      role: 'Driver',
      employmentDate: new Date().toISOString().split('T')[0],
      salary: {
        amount: 0,
        currency: 'KSh',
        paymentFrequency: 'Monthly'
      },
      notes: '',
      isActive: true
    });
    setIsSaving(false);
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStaff = filteredStaff.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Statistics
  const activeCount = staff.filter(s => s.isActive !== false).length;
  const inactiveCount = staff.filter(s => s.isActive === false).length;

  // Get role color
  const getRoleColor = (role) => {
    switch(role) {
      case 'Driver': return 'bg-blue-100 text-blue-800';
      case 'Gardener': return 'bg-green-100 text-green-800';
      case 'Cleaner': return 'bg-yellow-100 text-yellow-800';
      case 'Cook': return 'bg-red-100 text-red-800';
      case 'Security': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            <h1 className="text-3xl font-bold text-black">Non-Teaching Staff</h1>
            <p className="text-gold mt-2">Manage support staff (drivers, cleaners, security, etc.)</p>
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-right">
            <p className="text-2xl font-bold text-black">{staff.length}</p>
            <p className="text-sm text-gold">Total Staff</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Staff Card */}
        <div className="bg-white rounded-lg shadow p-4 text-center border-l-4 border-green-500">
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          <p className="text-gray-600 text-sm">Active Staff</p>
        </div>

        {/* Inactive Staff Card */}
        <div className="bg-white rounded-lg shadow p-4 text-center border-l-4 border-gray-400">
          <p className="text-2xl font-bold text-gray-600">{inactiveCount}</p>
          <p className="text-gray-600 text-sm">Inactive Staff</p>
        </div>

        {/* Role Distribution Card */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Roles Distribution</h3>
          <div className="space-y-1">
            {roles.map(role => {
              const count = staff.filter(s => s.role === role && s.isActive !== false).length;
              if (count === 0) return null;
              return (
                <div key={role} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{role}</span>
                  <span className="text-sm font-medium text-gray-800">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Monthly Salary Card */}
        <div className="bg-white rounded-lg shadow p-4 text-center border-l-4 border-purple-500">
          <div className="text-2xl font-bold text-purple-600">
            KSh {staff
              .filter(s => s.isActive !== false && s.salary?.paymentFrequency === 'Monthly')
              .reduce((total, s) => total + (s.salary?.amount || 0), 0)
              .toLocaleString()}
          </div>
          <p className="text-gray-600 text-sm">Monthly Salary Total</p>
        </div>
      </div>

      {/* Action Bar with Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <h2 className="text-xl font-semibold text-gray-800">Support Staff Records</h2>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              <select
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Staff</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Role:</span>
              <select
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Add Staff Button */}
            <button 
              className="bg-maroon text-white px-4 py-2 rounded-lg hover:bg-dark-maroon transition-colors flex items-center"
              onClick={() => setShowStaffForm(true)}
            >
              <span className="mr-2">+</span> Add Staff
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search staff by name, email, or role..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Staff Form Modal */}
      {showStaffForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-maroon">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h2>
            <form onSubmit={handleSubmitStaff} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="staff@awinja.edu"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Date *</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.employmentDate}
                  onChange={(e) => setFormData({...formData, employmentDate: e.target.value})}
                />
              </div>

              {/* Salary Information */}
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-lg font-medium text-maroon mb-3">Salary Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KSh)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                      value={formData.salary.amount}
                      onChange={(e) => setFormData({
                        ...formData,
                        salary: { ...formData.salary, amount: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                      value={formData.salary.currency}
                      onChange={(e) => setFormData({
                        ...formData,
                        salary: { ...formData.salary, currency: e.target.value }
                      })}
                      placeholder="KSh"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Frequency</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                      value={formData.salary.paymentFrequency}
                      onChange={(e) => setFormData({
                        ...formData,
                        salary: { ...formData.salary, paymentFrequency: e.target.value }
                      })}
                    >
                      {paymentFrequencies.map(freq => (
                        <option key={freq} value={freq}>{freq}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon focus:border-maroon transition-colors"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes..."
                  rows="3"
                />
              </div>

              {editingStaff && (
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
                      {editingStaff ? 'Updating...' : 'Adding...'}
                    </span>
                  ) : (
                    editingStaff ? 'Update Staff' : 'Add Staff'
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

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Staff Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Employed Since</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentStaff.map((staffMember) => (
                <tr key={staffMember._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-maroon rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {staffMember.firstName?.charAt(0)}{staffMember.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{staffMember.firstName} {staffMember.lastName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staffMember.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staffMember.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(staffMember.role)}`}>
                      {staffMember.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KSh {(staffMember.salary?.amount || 0).toLocaleString()}
                    <span className="text-xs text-gray-500 ml-1">/{staffMember.salary?.paymentFrequency || 'Monthly'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(staffMember.employmentDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleToggleStatus(staffMember)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        staffMember.isActive !== false 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {staffMember.isActive !== false ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditStaff(staffMember)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staffMember._id)}
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
        
        {filteredStaff.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">👨‍🍳</div>
            <p className="text-lg mb-2">No staff members found</p>
            {statusFilter === 'inactive' && inactiveCount === 0 ? (
              <p className="text-sm">No inactive staff found. Deactivate a staff member first.</p>
            ) : (
              <p className="text-sm">Try adjusting your search terms or filters</p>
            )}
          </div>
        ) : (
          // Pagination Controls
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredStaff.length)}
                </span>{' '}
                of <span className="font-medium">{filteredStaff.length}</span> staff members
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Staff per page:</span>
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
            Showing {currentStaff.length} of {filteredStaff.length} staff members (Page {currentPage} of {totalPages}) • 
            <span className="ml-2">
              <span className="text-green-600 font-medium">{activeCount} active</span>
              {inactiveCount > 0 && <span className="ml-2 text-gray-600">{inactiveCount} inactive</span>}
            </span>
          </span>
          <span className="text-sm font-medium text-maroon">
            Total: {staff.length} staff members
          </span>
        </div>
      </div>
    </div>
  );
};

export default NonTeachingStaff;