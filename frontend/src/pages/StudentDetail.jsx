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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
        <span className="ml-3">Loading student data...</span>
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
          className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Students List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/students')}
          className="text-blue-800 hover:text-blue-600 flex items-center"
        >
          ← Back to Students
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Student Profile</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Student Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Admission Number</label>
            <p className="text-lg font-semibold">{student.admissionNumber}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Full Name</label>
            <p className="text-lg font-semibold">{student.firstName} {student.lastName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Grade</label>
            <p className="text-lg font-semibold">{student.grade}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Gender</label>
            <p className="text-lg font-semibold">{student.gender}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Parent/Guardian</label>
            <p className="text-lg font-semibold">{student.parentName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Parent Phone</label>
            <p className="text-lg font-semibold">{student.parentPhone}</p>
          </div>
          {student.knecCode && (
            <div>
              <label className="text-sm font-medium text-gray-500">KNEC Code</label>
              <p className="text-lg font-semibold">{student.knecCode}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Fee Payment History</h2>
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Term</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Amount Paid</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Balance</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id} className="border-t">
                    <td className="px-4 py-2 text-sm">
                      {new Date(payment.datePaid).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm">{payment.term}</td>
                    <td className="px-4 py-2 text-sm font-medium text-green-600">
                      KSh {payment.amountPaid?.toLocaleString() || '0'}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-red-600">
                      KSh {payment.balance?.toLocaleString() || '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No fee payments recorded yet.</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
        <div className="space-y-3">
          <button 
            onClick={() => navigate('/fees')}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-500"
          >
            💰 Record Fee Payment
          </button>
          <button 
            onClick={() => navigate('/students')}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500"
          >
            ✏️ Edit Student
          </button>
          <button 
            onClick={() => fetchStudentData(true)}
            disabled={refreshing}
            className={`w-full py-2 rounded-lg flex items-center justify-center ${
              refreshing 
                ? 'bg-purple-400 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-500'
            } text-white`}
          >
            {refreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Refreshing...
              </>
            ) : (
              '🔄 Refresh Payments'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;