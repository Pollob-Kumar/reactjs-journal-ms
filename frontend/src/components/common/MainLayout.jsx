import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  FaHome,
  FaFileAlt,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaUser,
  FaBars,
  FaTimes,
  FaBook,
  FaChartBar
} from 'react-icons/fa';
import './MainLayout.css';

const MainLayout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Navigation items based on roles
  const getNavigationItems = () => {
    const items = [];

    if (hasRole('author')) {
      items.push(
        { path: '/author/dashboard', icon: <FaHome />, label: 'Dashboard', role: 'author' },
        { path: '/author/submit', icon: <FaFileAlt />, label: 'Submit Manuscript', role: 'author' },
        { path: '/author/submissions', icon: <FaBook />, label: 'My Submissions', role: 'author' }
      );
    }

    if (hasRole('reviewer')) {
      items.push(
        { path: '/reviewer/dashboard', icon: <FaHome />, label: 'Reviewer Dashboard', role: 'reviewer' },
        { path: '/reviewer/reviews', icon: <FaFileAlt />, label: 'My Reviews', role: 'reviewer' }
      );
    }

    if (hasRole('editor')) {
      items.push(
        { path: '/editor/dashboard', icon: <FaHome />, label: 'Editor Dashboard', role: 'editor' },
        { path: '/editor/submissions', icon: <FaBook />, label: 'Manage Submissions', role: 'editor' },
        { path: '/editor/issues', icon: <FaBook />, label: 'Manage Issues', role: 'editor' }
      );
    }

    if (hasRole('admin')) {
  items.push(
    { path: '/admin/dashboard', icon: <FaHome />, label: 'Admin Dashboard', role: 'admin' },
    { path: '/admin/users', icon: <FaUsers />, label: 'User Management', role: 'admin' },
    { path: '/admin/submissions', icon: <FaBook />, label: 'All Submissions', role: 'admin' },
    { path: '/admin/doi/deposits', icon: <FaLink />, label: 'DOI Management', role: 'admin' }, // Add this
    { path: '/admin/analytics', icon: <FaChartBar />, label: 'Analytics', role: 'admin' },
    { path: '/admin/settings', icon: <FaCog />, label: 'System Settings', role: 'admin' }
  );
}

    return items;
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="main-layout">
      {/* Top Header */}
      <header className="main-header">
        <div className="header-left">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <h1 className="header-title">PUJMS</h1>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            <FaUser />
            <span className="user-name">{user?.fullName}</span>
            <span className="user-role">{user?.roles?.join(', ')}</span>
          </div>
          
          <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </header>

      <div className="layout-container">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <nav className="sidebar-nav">
            <ul>
              {navigationItems.map((item, index) => (
                <li key={index}>
                  <Link 
                    to={item.path} 
                    className="nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                </li>
              ))}
              
              <li className="nav-divider"></li>
              
              <li>
                <Link 
                  to="/profile" 
                  className="nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="nav-icon"><FaUser /></span>
                  <span className="nav-label">My Profile</span>
                </Link>
              </li>
              
              <li>
                <Link 
                  to="/" 
                  className="nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="nav-icon"><FaHome /></span>
                  <span className="nav-label">Public Portal</span>
                </Link>
              </li>
              
              <li>
                <button className="nav-link logout-link" onClick={handleLogout}>
                  <span className="nav-icon"><FaSignOutAlt /></span>
                  <span className="nav-label">Logout</span>
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
