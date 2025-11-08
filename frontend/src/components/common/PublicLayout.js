import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { FaSearch, FaBook, FaInfoCircle, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import './PublicLayout.css';

const PublicLayout = () => {
  return (
    <div className="public-layout">
      {/* Header */}
      <header className="public-header">
        <div className="container">
          <div className="header-content">
            <div className="brand">
              <Link to="/" className="brand-link">
                <h1>Journal of Pundra University</h1>
                <p className="brand-subtitle">Science & Technology</p>
              </Link>
            </div>
            
            <nav className="public-nav">
              <Link to="/" className="nav-item">
                <FaBook /> Home
              </Link>
              <Link to="/current-issue" className="nav-item">
                Current Issue
              </Link>
              <Link to="/archives" className="nav-item">
                Archives
              </Link>
              <Link to="/search" className="nav-item">
                <FaSearch /> Search
              </Link>
              <Link to="/about" className="nav-item">
                <FaInfoCircle /> About
              </Link>
              <Link to="/login" className="nav-item btn-login">
                <FaSignInAlt /> Login
              </Link>
              <Link to="/register" className="nav-item btn-register">
                <FaUserPlus /> Register
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="public-main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="public-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>About the Journal</h3>
              <p>
                The Journal of Pundra University of Science & Technology is a peer-reviewed 
                academic journal publishing high-quality research in science and technology.
              </p>
            </div>
            
            <div className="footer-section">
              <h3>Quick Links</h3>
              <ul>
                <li><Link to="/current-issue">Current Issue</Link></li>
                <li><Link to="/archives">Archives</Link></li>
                <li><Link to="/search">Search Articles</Link></li>
                <li><Link to="/about">About Us</Link></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h3>For Authors</h3>
              <ul>
                <li><Link to="/register">Submit Manuscript</Link></li>
                <li><Link to="/login">Track Submission</Link></li>
                <li><Link to="/about#guidelines">Author Guidelines</Link></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h3>Contact</h3>
              <p>
                Pundra University<br />
                Science & Technology Campus<br />
                Email: journal@pundra.edu
              </p>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Pundra University. All rights reserved.</p>
            <p>Powered by PUJMS</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;