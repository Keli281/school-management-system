import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  console.log('ProtectedRoute - Token exists:', !!token);
  
  if (!token) {
    console.log('Redirecting to login...');
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;