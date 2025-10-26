import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Fees from './pages/Fees';
import StudentDetail from './pages/StudentDetail';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = location.pathname;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 
              className="text-2xl font-bold text-blue-800 flex items-center cursor-pointer" 
              onClick={() => navigate('/')}
            >
              🏫 Awinja Education Center
            </h1>
            <nav className="flex space-x-4">
              <button 
                className={`px-3 py-2 rounded-lg ${
                  currentPage === '/' 
                    ? 'bg-blue-800 text-white' 
                    : 'text-gray-600 hover:text-blue-800'
                }`}
                onClick={() => navigate('/')}
              >
                Dashboard
              </button>
              <button 
                className={`px-3 py-2 rounded-lg ${
                  currentPage === '/students' 
                    ? 'bg-blue-800 text-white' 
                    : 'text-gray-600 hover:text-blue-800'
                }`}
                onClick={() => navigate('/students')}
              >
                Students
              </button>
              <button 
                className={`px-3 py-2 rounded-lg ${
                  currentPage === '/fees' 
                    ? 'bg-blue-800 text-white' 
                    : 'text-gray-600 hover:text-blue-800'
                }`}
                onClick={() => navigate('/fees')}
              >
                Fees
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/student/:admissionNumber" element={<StudentDetail />} />
          
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Navigation />
    </Router>
  );
}

export default App;