import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = () => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    // Redirect based on role
    if (user.roles.includes('admin')) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.roles.includes('editor')) {
      return <Navigate to="/editor/dashboard" replace />;
    } else if (user.roles.includes('reviewer')) {
      return <Navigate to="/reviewer/dashboard" replace />;
    } else {
      return <Navigate to="/author/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default PublicRoute;