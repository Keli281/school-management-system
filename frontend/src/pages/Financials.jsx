import React, { useState } from 'react';

const Financials = () => {
  const [selectedYear, setSelectedYear] = useState('2026');

  // Fee structure for 2025 (without admission fees, daycare, and grade 4)
  const feeStructure2025 = [
    {
      grade: 'Playgroup',
      admissionFee: '-',
      term1: '3,000',
      term2: '2,800', 
      term3: '2,800',
      total: '8,600',
      notes: 'Flat fee structure'
    },
    {
      grade: 'PP1',
      admissionFee: '-',
      term1: '3,000',
      term2: '2,800',
      term3: '2,800',
      total: '8,600',
      notes: 'Flat fee structure'
    },
    {
      grade: 'PP2',
      admissionFee: '-',
      term1: '3,000',
      term2: '2,800',
      term3: '2,800',
      total: '8,600',
      notes: 'Flat fee structure'
    },
    {
      grade: 'Grade 1',
      admissionFee: '-',
      term1: '3,500',
      term2: '3,000',
      term3: '3,000',
      total: '9,500',
      notes: 'Standard primary fees'
    },
    {
      grade: 'Grade 2',
      admissionFee: '-',
      term1: '3,500',
      term2: '3,000',
      term3: '3,000',
      total: '9,500',
      notes: 'Standard primary fees'
    },
    {
      grade: 'Grade 3',
      admissionFee: '-',
      term1: '3,500',
      term2: '3,000',
      term3: '3,000',
      total: '9,500',
      notes: 'Standard primary fees'
    }
  ];

  // Fee structure for 2026 (with admission fees and daycare)
  const feeStructure2026 = [
    {
      grade: 'Day Care',
      admissionFee: '-',
      term1: '2,000',
      term2: '2,000', 
      term3: '2,000',
      total: '6,000',
      notes: 'Flat fee for all terms'
    },
    {
      grade: 'Playgroup',
      admissionFee: '-',
      term1: '3,000',
      term2: '3,000',
      term3: '3,000',
      total: '9,000',
      notes: 'Flat fee for all terms'
    },
    {
      grade: 'PP1',
      admissionFee: '500',
      term1: '3,000',
      term2: '3,000',
      term3: '3,000',
      total: '9,500',
      notes: 'Includes one-time admission fee'
    },
    {
      grade: 'PP2',
      admissionFee: '500',
      term1: '3,000',
      term2: '3,000',
      term3: '3,000',
      total: '9,500',
      notes: 'Includes one-time admission fee'
    },
    {
      grade: 'Grade 1',
      admissionFee: '1,000',
      term1: '3,500',
      term2: '3,500',
      term3: '3,500',
      total: '11,500',
      notes: 'Includes one-time admission fee'
    },
    {
      grade: 'Grade 2',
      admissionFee: '1,000',
      term1: '3,500',
      term2: '3,500',
      term3: '3,500',
      total: '11,500',
      notes: 'Includes one-time admission fee'
    },
    {
      grade: 'Grade 3',
      admissionFee: '1,000',
      term1: '3,500',
      term2: '3,500',
      term3: '3,500',
      total: '11,500',
      notes: 'Includes one-time admission fee'
    },
    {
      grade: 'Grade 4',
      admissionFee: '1,000',
      term1: '4,500',
      term2: '4,000',
      term3: '4,000',
      total: '13,500',
      notes: 'Term 1 fee is higher'
    }
  ];

  const currentStructure = selectedYear === '2026' ? feeStructure2026 : feeStructure2025;
  const showAdmissionFee = selectedYear === '2026';

  const calculateGrandTotal = () => {
    return currentStructure.reduce((total, grade) => {
      const gradeTotal = parseInt(grade.total.replace(/,/g, ''));
      return total + gradeTotal;
    }, 0);
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section */}
      <div className="text-center bg-gradient-to-r from-maroon to-dark-maroon rounded-2xl shadow-xl p-8 text-black">
        <h1 className="text-4xl font-bold mb-4">School Fee Structure</h1>
        <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-6">
          <p className="text-gold text-lg italic">Academic Year</p>
          <select
            className="px-4 py-2 bg-white bg-opacity-20 border border-gold rounded-lg focus:outline-none focus:ring-2 focus:ring-gold text-black font-medium"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      </div>

      {/* Summary Cards - REMOVED Average Fee Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500 transform hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Total Grades</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{currentStructure.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xl"></span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">Different grade levels</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500 transform hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Grand Total</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">KSh {calculateGrandTotal().toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-xl"></span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">Total for all grades annually</p>
        </div>
      </div>

      {/* Fee Structure Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-maroon p-6">
          <h2 className="text-2xl font-bold text-white text-center">
            Detailed Fee Structure for {selectedYear} (KSh)
          </h2>
          <p className="text-gold text-center mt-2">All amounts in Kenyan Shillings</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-maroon uppercase tracking-wider border-b">
                  Grade Level
                </th>
                {showAdmissionFee && (
                  <th className="px-6 py-4 text-left text-xs font-medium text-maroon uppercase tracking-wider border-b">
                    Admission Fee
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-medium text-maroon uppercase tracking-wider border-b">
                  Term 1
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-maroon uppercase tracking-wider border-b">
                  Term 2
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-maroon uppercase tracking-wider border-b">
                  Term 3
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-maroon uppercase tracking-wider border-b">
                  Annual Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-maroon uppercase tracking-wider border-b">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentStructure.map((grade, index) => (
                <tr 
                  key={grade.grade} 
                  className={`hover:bg-gray-50 transition-colors duration-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        grade.grade.includes('Grade') ? 'bg-blue-100 text-blue-600' : 
                        grade.grade.includes('PP') ? 'bg-green-100 text-green-600' : 
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {grade.grade.includes('Grade') ? 'G' : 
                         grade.grade.includes('PP') ? 'P' : 
                         grade.grade.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{grade.grade}</span>
                    </div>
                  </td>
                  {showAdmissionFee && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        grade.admissionFee === '-' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {grade.admissionFee}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {grade.term1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {grade.term2}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {grade.term3}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-maroon text-white">
                      {grade.total}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {grade.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Important Notes Section */}
      <div className="bg-gradient-to-r from-gold to-dark-gold rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="w-6 h-6 bg-maroon rounded-full mr-2 flex items-center justify-center text-xs text-white">!</span>
          Important Fee Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <div className="flex items-start space-x-3">
            <span className="text-maroon mt-1">•</span>
            <p>{selectedYear === '2026' ? 'Admission fees are one-time payments for new students' : 'No admission fees for the 2025 academic year'}</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-maroon mt-1">•</span>
            <p>Fee payments can be made in installments per term</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-maroon mt-1">•</span>
            <p>All fees are payable before the beginning of each term</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-maroon mt-1">•</span>
            <p>Stationery, uniform, and KNEC registration are exclusive</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Financials;