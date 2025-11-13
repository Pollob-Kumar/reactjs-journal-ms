import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.some(role => user?.roles?.includes(role));
    
    if (!hasRequiredRole) {
      return <Navigate to="/403" replace />;
    }
  }

  return children;
};

export default PrivateRoute;