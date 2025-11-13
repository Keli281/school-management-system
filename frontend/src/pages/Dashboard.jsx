import React, { useState, useEffect } from 'react';
import { studentsAPI, feesAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFees: 0,
    recentPayments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
  try {
    const [studentsRes, paymentsRes] = await Promise.all([
      studentsAPI.getAll(),
      feesAPI.getPayments()  // ✅ Use this instead - it EXISTS in your backend
    ]);

    // Calculate total fees manually from all payments
    const totalFees = paymentsRes.data.payments.reduce((sum, payment) => sum + payment.amountPaid, 0);

    setStats({
      totalStudents: studentsRes.data.count,
      totalFees: totalFees,  // ✅ Now this will have the real total
      recentPayments: [] // We'll add this later
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon"></div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-8">
      {/* School Header Section */}
      <div className="text-center bg-gradient-to-r from-maroon to-dark-maroon rounded-2xl shadow-xl p-8 text-white transform hover:scale-[1.01] transition-transform duration-300">
        <div className="flex flex-col items-center space-y-4">
          {/* School Logo */}
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-gold">
            <img 
              src="/media/logo.png" 
              alt="Awinja Education Centre" 
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2 text-black">Awinja Education Centre</h1>
            <p className="text-gold text-lg italic">Honouring God through Excellence</p>
          </div>
        </div>
      </div>

      {/* Mission & Vision Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-gold transform hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-bold text-maroon mb-3 flex items-center">
            <span className="w-6 h-6 bg-gold rounded-full mr-2 flex items-center justify-center text-xs text-maroon">M</span>
            Our Mission
          </h3>
          <p className="text-gray-700 leading-relaxed">
            To provide quality education that nurtures holistic development, instills Christian values, 
            and empowers students to achieve academic excellence while becoming responsible citizens.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-maroon transform hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-bold text-maroon mb-3 flex items-center">
            <span className="w-6 h-6 bg-maroon rounded-full mr-2 flex items-center justify-center text-xs text-white">V</span>
            Our Vision
          </h3>
          <p className="text-gray-700 leading-relaxed">
            To be a leading educational institution recognized for developing future leaders 
            who excel academically, spiritually, and socially through innovative learning and strong moral foundation.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-[1.02] transition-all duration-300 border-t-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Total Students</h3>
              <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="fas fa-user-graduate text-blue-600 text-xl"></i>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">Enrolled students for {currentYear}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-[1.02] transition-all duration-300 border-t-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Total Fees Collected</h3>
              <p className="text-4xl font-bold text-green-600 mt-2">KSh {stats.totalFees.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <i className="fas fa-money-bill-wave text-green-600 text-xl"></i>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">Total revenue collected</p>
        </div>
      </div>

      {/* Documents Download Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-2xl font-bold text-maroon mb-6 text-center">School Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-dashed border-gold rounded-lg p-6 text-center hover:bg-gold hover:bg-opacity-10 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="w-16 h-16 bg-maroon rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-file-alt text-white text-2xl"></i>
            </div>
            <h4 className="text-lg font-semibold text-maroon mb-2">Admission Form</h4>
            <p className="text-gray-600 text-sm mb-4">Download our student admission application form</p>
            <a 
              href="/media/admission-form.pdf" 
              download
              className="inline-block bg-maroon text-white px-6 py-2 rounded-lg hover:bg-dark-maroon transition-colors"
            >
              Download PDF
            </a>
          </div>

          <div className="border-2 border-dashed border-maroon rounded-lg p-6 text-center hover:bg-maroon hover:bg-opacity-5 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-tshirt text-maroon text-2xl"></i>
            </div>
            <h4 className="text-lg font-semibold text-maroon mb-2">Uniform Price List</h4>
            <p className="text-gray-600 text-sm mb-4">Complete school uniform and requirements pricing</p>
            <a 
              href="/media/uniform-price-list.pdf" 
              download
              className="inline-block bg-gold text-gray-800 px-6 py-2 rounded-lg hover:bg-dark-gold transition-colors"
            >
              Download PDF
            </a>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        <h3 className="text-2xl font-bold text-center mb-6 text-maroon">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="transform hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-maroon rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-map-marker-alt text-white text-xl"></i>
            </div>
            <h4 className="font-semibold text-maroon mb-2">Location</h4>
            <p className="text-sm text-gray-600">
              Along Kantafu - Misuuni Road, Koma, Matungulu West<br />
              P.O Box 6154 - 00100, Nairobi
            </p>
          </div>

          <div className="transform hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-maroon rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-phone-alt text-white text-xl"></i>
            </div>
            <h4 className="font-semibold text-maroon mb-2">Phone Numbers</h4>
            <p className="text-sm text-gray-600">
              0722 951 183<br />
              0723 359 082
            </p>
          </div>

          <div className="transform hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-maroon rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-envelope text-white text-xl"></i>
            </div>
            <h4 className="font-semibold text-maroon mb-2">Email</h4>
            <p className="text-sm text-gray-600">
              awinjaeducationcentre<br />@gmail.com
            </p>
          </div>

          <div className="transform hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-maroon rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-clock text-white text-xl"></i>
            </div>
            <h4 className="font-semibold text-maroon mb-2">Operating Hours</h4>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-maroon">Teachers:</span><br />
              7:00 AM - 4:50 PM<br />
              <span className="font-medium text-maroon mt-1 inline-block">Learners:</span><br />
              7:30 AM - 4:30 PM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;