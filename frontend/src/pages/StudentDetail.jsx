import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentsAPI, feesAPI } from '../services/api';

const StudentDetail = () => {
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { admissionNumber } = useParams();
  const navigate = useNavigate();

  // DECODE the URL parameter
  const decodedAdmissionNumber = decodeURIComponent(admissionNumber);

  const fetchStudentData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log('📡 Fetching student data for:', decodedAdmissionNumber);
      
      const studentRes = await studentsAPI.getByAdmission(decodedAdmissionNumber);
      console.log('✅ Student API response:', studentRes.data);
      
      if (!studentRes.data.success) {
        throw new Error('Student not found in API response');
      }

      setStudent(studentRes.data.student);

      // Get payments
      try {
        const paymentsRes = await feesAPI.getStudentPayments(decodedAdmissionNumber);
        setPayments(paymentsRes.data.payments || []);
        console.log('✅ Payments loaded:', paymentsRes.data.payments?.length || 0);
      } catch (paymentError) {
        console.log('⚠️ Could not load payments:', paymentError);
        setPayments([]);
      }

    } catch (error) {
      console.error('❌ Error fetching student:', error);
      alert('Student not found! Redirecting to students list.');
      navigate('/students');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log('🔍 StudentDetail loaded with encoded URL param:', admissionNumber);
    console.log('🔍 StudentDetail decoded parameter:', decodedAdmissionNumber);
    fetchStudentData();
  }, [decodedAdmissionNumber]);

  // Calculate totals
  const totalPaid = payments.reduce((sum, payment) => sum + (payment.amountPaid || 0), 0);
  const currentBalance = payments.length > 0 ? payments[payments.length - 1]?.balance || 0 : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
        <span className="ml-3 text-gray-600">Loading student data...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-lg mb-4">Student not found!</p>
        <p className="text-gray-600 mb-2">Admission Number: {decodedAdmissionNumber}</p>
        <button 
          onClick={() => navigate('/students')}
          className="bg-maroon text-white px-4 py-2 rounded-lg hover:bg-dark-maroon transition-colors"
        >
          Back to Students List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-maroon to-dark-maroon rounded-2xl shadow-xl p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/students')}
              className="text-gold hover:text-white flex items-center transition-colors"
            >
              ← Back to Students
            </button>
            <div>
              <h1 className="text-3xl font-bold text-black">Student Profile</h1>
              <p className="text-gold mt-2">{student.admissionNumber}</p>
            </div>
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-right">
            <p className="text-2xl font-bold text-black">KSh {totalPaid.toLocaleString()}</p>
            <p className="text-sm text-gold">Total Paid</p>
          </div>
        </div>
      </div>

      {/* Student Information Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-maroon">
        <h2 className="text-2xl font-bold text-maroon mb-6 flex items-center">
          <span className="w-8 h-8 bg-maroon rounded-full mr-3 flex items-center justify-center text-white text-sm">👤</span>
          Student Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Admission Number</label>
            <p className="text-lg font-semibold text-gray-900">{student.admissionNumber}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Full Name</label>
            <p className="text-lg font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Grade</label>
            <p className="text-lg font-semibold">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {student.grade}
              </span>
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Gender</label>
            <p className="text-lg font-semibold">
              <span className={`px-3 py-1 rounded-full text-sm ${
                student.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
              }`}>
                {student.gender}
              </span>
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Parent/Guardian</label>
            <p className="text-lg font-semibold text-gray-900">{student.parentName}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Parent Phone</label>
            <p className="text-lg font-semibold text-gray-900">{student.parentPhone}</p>
          </div>
          {student.knecCode && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">KNEC Code</label>
              <p className="text-lg font-semibold text-gray-900">{student.knecCode}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment History Card */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-maroon flex items-center">
            <span className="w-8 h-8 bg-gold rounded-full mr-3 flex items-center justify-center text-maroon text-sm">💰</span>
            Fee Payment History
          </h2>
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">KSh {totalPaid.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Paid</p>
          </div>
        </div>
        
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Term</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Amount Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-maroon uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.datePaid).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.term === 'Term 1' ? 'bg-blue-100 text-blue-800' :
                        payment.term === 'Term 2' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {payment.term}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      KSh {payment.amountPaid?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      KSh {payment.balance?.toLocaleString() || '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">💸</div>
            <p className="text-lg mb-2">No fee payments recorded yet</p>
            <p className="text-sm">Record the first payment for this student</p>
          </div>
        )}
      </div>

      {/* Enhanced Quick Actions Card */}
      <div className="bg-gradient-to-br from-maroon to-dark-maroon rounded-2xl shadow-xl p-8 text-white">
        <h2 className="text-2xl font-bold text-center mb-8 text-gold">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Record Payment Card */}
          <div 
            onClick={() => navigate('/fees')}
            className="bg-white rounded-xl p-6 text-center cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">💰</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Record Payment</h3>
            <p className="text-gray-600 text-sm mb-4">Add new fee payment for this student</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors w-full">
              Record Fee
            </button>
          </div>

          {/* Edit Student Card */}
          <div 
            onClick={() => navigate('/students')}
            className="bg-white rounded-xl p-6 text-center cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl">✏️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Edit Student</h3>
            <p className="text-gray-600 text-sm mb-4">Update student information and details</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors w-full">
              Edit Profile
            </button>
          </div>

          {/* Refresh Card */}
          <div 
            onClick={() => !refreshing && fetchStudentData(true)}
            className={`rounded-xl p-6 text-center cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl ${
              refreshing ? 'bg-purple-400' : 'bg-white'
            }`}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              refreshing ? 'bg-purple-200' : 'bg-purple-100'
            }`}>
              {refreshing ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              ) : (
                <span className="text-purple-600 text-2xl">🔄</span>
              )}
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${
              refreshing ? 'text-white' : 'text-gray-800'
            }`}>
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </h3>
            <p className={`text-sm mb-4 ${
              refreshing ? 'text-purple-100' : 'text-gray-600'
            }`}>
              {refreshing ? 'Updating information...' : 'Reload latest payments and data'}
            </p>
            <button 
              disabled={refreshing}
              className={`px-4 py-2 rounded-lg transition-colors w-full ${
                refreshing 
                  ? 'bg-purple-300 text-white cursor-not-allowed' 
                  : 'bg-purple-600 text-white hover:bg-purple-500'
              }`}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;