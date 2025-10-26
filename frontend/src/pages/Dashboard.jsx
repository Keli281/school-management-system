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
      const [studentsRes, feesRes] = await Promise.all([
        studentsAPI.getAll(),
        feesAPI.getDashboardSummary()
      ]);

      setStats({
        totalStudents: studentsRes.data.count,
        totalFees: feesRes.data.summary.totalCollected,
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Students</h3>
          <p className="text-3xl font-bold text-blue-800">{stats.totalStudents}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Fees Collected</h3>
          <p className="text-3xl font-bold text-green-600">KSh {stats.totalFees.toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700">Active This Year</h3>
          <p className="text-3xl font-bold text-purple-600">2025</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Welcome to Awinja Education Center</h3>
        <p className="text-gray-600">
          School Management System - Managing {stats.totalStudents} students and KSh {stats.totalFees.toLocaleString()} in fees.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;