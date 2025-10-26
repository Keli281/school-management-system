import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Fees from './pages/Fees';
import StudentDetail from './pages/StudentDetail';
import Login from './pages/Login';
import Financials from './pages/Financials';
import Teachers from './pages/Teachers';

// Simple Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// Mobile Responsive Navigation Component
const NavigationWrapper = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const currentPage = location.pathname;

  const navigationItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/students', label: 'Students' },
    { path: '/teachers', label: 'Teachers' },
    { path: '/fees', label: 'Fees' },
    { path: '/financials', label: 'Financials' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and School Name */}
            <div className="flex items-center space-x-4">
              <h1 
                className="text-xl md:text-2xl font-bold text-maroon flex items-center cursor-pointer" 
                onClick={() => navigate('/')}
              >
                <div className="w-8 h-8 bg-maroon rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-sm font-bold">AEC</span>
                </div>
                <span className="hidden sm:inline">Awinja Education Center</span>
                <span className="sm:hidden">Awinja EC</span>
              </h1>
              {user && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gold text-gray-800 hidden md:inline-block">
                  Administrator
                </span>
              )}
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {navigationItems.map((item) => (
                <button 
                  key={item.path}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === item.path 
                      ? 'bg-maroon text-white' 
                      : 'text-gray-600 hover:text-maroon'
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </button>
              ))}
              
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 hidden lg:inline">
                    Welcome, Admin
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/login')}
                  className="px-3 py-2 bg-maroon text-white rounded-lg hover:bg-dark-maroon transition-colors"
                >
                  Login
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-maroon hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t pt-4">
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <button 
                    key={item.path}
                    className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      currentPage === item.path 
                        ? 'bg-maroon text-white' 
                        : 'text-gray-600 hover:text-maroon hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
                
                {user ? (
                  <div className="pt-2 border-t space-y-2">
                    <div className="px-3 py-2 text-sm text-gray-600">
                      Welcome, Administrator
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 bg-maroon text-white rounded-lg hover:bg-dark-maroon transition-colors"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p className="font-semibold text-maroon">Awinja Education Center</p>
            <p className="text-sm italic">Honoring God through Excellence</p>
            <p className="text-xs mt-2">© 2025 Awinja Education Center. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes (No Navigation) */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes (With Navigation) */}
        <Route path="/" element={
          <ProtectedRoute>
            <NavigationWrapper>
              <Dashboard />
            </NavigationWrapper>
          </ProtectedRoute>
        } />
        <Route path="/students" element={
          <ProtectedRoute>
            <NavigationWrapper>
              <Students />
            </NavigationWrapper>
          </ProtectedRoute>
        } />
        <Route path="/fees" element={
          <ProtectedRoute>
            <NavigationWrapper>
              <Fees />
            </NavigationWrapper>
          </ProtectedRoute>
        } />
        <Route path="/student/:admissionNumber" element={
          <ProtectedRoute>
            <NavigationWrapper>
              <StudentDetail />
            </NavigationWrapper>
          </ProtectedRoute>
        } />
        <Route path="/financials" element={
          <ProtectedRoute>
            <NavigationWrapper>
              <Financials />
            </NavigationWrapper>
          </ProtectedRoute>
        } />
        <Route path="/teachers" element={
          <ProtectedRoute>
            <NavigationWrapper>
              <Teachers />
            </NavigationWrapper>
          </ProtectedRoute>
        } />
        
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;