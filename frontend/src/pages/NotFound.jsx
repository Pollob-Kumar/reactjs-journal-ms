import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    
    if (user.roles.includes('admin')) return '/admin/dashboard';
    if (user.roles.includes('editor')) return '/editor/dashboard';
    if (user.roles.includes('reviewer')) return '/reviewer/dashboard';
    if (user.roles.includes('author')) return '/author/dashboard';
    
    return '/';
  };

  return (
    <div className="not-found">
      <div className="not-found-content">
        {/* 404 Animation */}
        <div className="error-animation">
          <div className="error-number">
            <span className="four">4</span>
            <span className="zero">
              <i className="fas fa-search"></i>
            </span>
            <span className="four">4</span>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-description">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="error-actions">
          <button onClick={handleGoBack} className="btn btn-outline">
            <i className="fas fa-arrow-left"></i> Go Back
          </button>
          <Link to={getDashboardLink()} className="btn btn-primary">
            <i className="fas fa-home"></i> {user ? 'Go to Dashboard' : 'Go to Home'}
          </Link>
        </div>

        {/* Quick Links */}
        <div className="quick-links">
          <h3>You might be looking for:</h3>
          <div className="links-grid">
            <Link to="/" className="quick-link">
              <i className="fas fa-home"></i>
              <span>Home</span>
            </Link>
            <Link to="/search" className="quick-link">
              <i className="fas fa-search"></i>
              <span>Search Articles</span>
            </Link>
            <Link to="/current-issue" className="quick-link">
              <i className="fas fa-book"></i>
              <span>Current Issue</span>
            </Link>
            <Link to="/archives" className="quick-link">
              <i className="fas fa-archive"></i>
              <span>Archives</span>
            </Link>
            {!user && (
              <Link to="/login" className="quick-link">
                <i className="fas fa-sign-in-alt"></i>
                <span>Login</span>
              </Link>
            )}
            {user && (
              <Link to="/profile" className="quick-link">
                <i className="fas fa-user"></i>
                <span>My Profile</span>
              </Link>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="help-section">
          <p>
            <i className="fas fa-question-circle"></i> 
            If you believe this is an error, please contact support at{' '}
            <a href="mailto:support@journal.pundra.edu">support@journal.pundra.edu</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;