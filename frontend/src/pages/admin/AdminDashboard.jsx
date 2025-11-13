import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout.jsx';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Card from '../../components/common/Card.jsx';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalAuthors: 0,
    totalReviewers: 0,
    totalEditors: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    acceptedSubmissions: 0,
    rejectedSubmissions: 0,
    totalReviews: 0,
    completedReviews: 0,
    totalIssues: 0,
    publishedIssues: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    storage: 'healthy',
    email: 'healthy'
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch admin statistics
      const statsResponse = await api.get('/admin/statistics');
      setStatistics(statsResponse.data);

      // Fetch recent users (last 5)
      const usersResponse = await api.get('/users?limit=5&sortBy=createdAt&sortOrder=desc');
      setRecentUsers(usersResponse.data);

      // Fetch recent submissions
      const submissionsResponse = await api.get('/manuscripts?limit=5&sortBy=submittedAt&sortOrder=desc');
      setRecentSubmissions(submissionsResponse.data.manuscripts || submissionsResponse.data);

      // Fetch system health
      const healthResponse = await api.get('/admin/health');
      setSystemHealth(healthResponse.data);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAcceptanceRate = () => {
    if (statistics.totalSubmissions === 0) return 0;
    return ((statistics.acceptedSubmissions / statistics.totalSubmissions) * 100).toFixed(1);
  };

  const calculateReviewCompletionRate = () => {
    if (statistics.totalReviews === 0) return 0;
    return ((statistics.completedReviews / statistics.totalReviews) * 100).toFixed(1);
  };

  if (loading) return <Loading />;

  return (
    <MainLayout>
      <div className="admin-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>System Administration</h1>
            <p className="welcome-text">Welcome, {user?.firstName}! Here's your system overview.</p>
          </div>
          <div className="header-actions">
            <Link to="/admin/users" className="btn btn-primary">
              <i className="fas fa-users"></i> Manage Users
            </Link>
            <Link to="/admin/settings" className="btn btn-outline">
              <i className="fas fa-cog"></i> Settings
            </Link>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* System Health Status */}
        <Card className="health-card">
          <div className="health-header">
            <h2>
              <i className="fas fa-heartbeat"></i> System Health
            </h2>
            <span className="health-status healthy">
              <i className="fas fa-check-circle"></i> All Systems Operational
            </span>
          </div>
          <div className="health-grid">
            <div className="health-item">
              <div className={`health-indicator ${systemHealth.database}`}>
                <i className="fas fa-database"></i>
              </div>
              <div>
                <h4>Database</h4>
                <p className={systemHealth.database}>{systemHealth.database}</p>
              </div>
            </div>
            <div className="health-item">
              <div className={`health-indicator ${systemHealth.storage}`}>
                <i className="fas fa-cloud"></i>
              </div>
              <div>
                <h4>File Storage</h4>
                <p className={systemHealth.storage}>{systemHealth.storage}</p>
              </div>
            </div>
            <div className="health-item">
              <div className={`health-indicator ${systemHealth.email}`}>
                <i className="fas fa-envelope"></i>
              </div>
              <div>
                <h4>Email Service</h4>
                <p className={systemHealth.email}>{systemHealth.email}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Statistics Overview */}
        <div className="statistics-section">
          <h2 className="section-title">
            <i className="fas fa-chart-line"></i> Platform Statistics
          </h2>
          
          {/* User Statistics */}
          <div className="stats-category">
            <h3>User Management</h3>
            <div className="stats-grid">
              <Card className="stat-card total-users">
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-content">
                  <h3>{statistics.totalUsers}</h3>
                  <p>Total Users</p>
                </div>
                <Link to="/admin/users" className="stat-link">
                  Manage <i className="fas fa-arrow-right"></i>
                </Link>
              </Card>

              <Card className="stat-card authors">
                <div className="stat-icon">
                  <i className="fas fa-pen"></i>
                </div>
                <div className="stat-content">
                  <h3>{statistics.totalAuthors}</h3>
                  <p>Authors</p>
                </div>
              </Card>

              <Card className="stat-card reviewers">
                <div className="stat-icon">
                  <i className="fas fa-user-tie"></i>
                </div>
                <div className="stat-content">
                  <h3>{statistics.totalReviewers}</h3>
                  <p>Reviewers</p>
                </div>
              </Card>

              <Card className="stat-card editors">
                <div className="stat-icon">
                  <i className="fas fa-user-shield"></i>
                </div>
                <div className="stat-content">
                  <h3>{statistics.totalEditors}</h3>
                  <p>Editors</p>
                </div>
              </Card>
            </div>
          </div>



{/* DOI Statistics */}
<div className="stats-category">
  <h3>DOI Management</h3>
  <div className="stats-grid">
    <Card className="stat-card">
      <div className="stat-icon">
        <i className="fas fa-link"></i>
      </div>
      <div className="stat-content">
        <h3>{statistics.doi?.success || 0}</h3>
        <p>DOIs Assigned</p>
      </div>
      <Link to="/admin/doi/deposits?status=success" className="stat-link">
        View <i className="fas fa-arrow-right"></i>
      </Link>
    </Card>

    <Card className="stat-card">
      <div className="stat-icon">
        <i className="fas fa-exclamation-triangle"></i>
      </div>
      <div className="stat-content">
        <h3>{statistics.doi?.failed || 0}</h3>
        <p>Failed Deposits</p>
      </div>
      <Link to="/admin/doi/deposits?status=failed" className="stat-link">
        Retry <i className="fas fa-arrow-right"></i>
      </Link>
    </Card>

    <Card className="stat-card">
      <div className="stat-icon">
        <i className="fas fa-clock"></i>
      </div>
      <div className="stat-content">
        <h3>{statistics.doi?.not_assigned || 0}</h3>
        <p>Pending Assignment</p>
      </div>
      <Link to="/admin/doi/deposits?status=not_assigned" className="stat-link">
        Assign <i className="fas fa-arrow-right"></i>
      </Link>
    </Card>
  </div>
</div>

          {/* Submission Statistics */}
          <div className="stats-category">
            <h3>Manuscript Management</h3>
            <div className="stats-grid">
              <Card className="stat-card total-submissions">
                <div className="stat-icon">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="stat-content">
                  <h3>{statistics.totalSubmissions}</h3>
                  <p>Total Submissions</p>
                </div>
                <Link to="/admin/submissions" className="stat-link">
                  View All <i className="fas fa-arrow-right"></i>
                </Link>
              </Card>

              <Card className="stat-card pending">
                <div className="stat-icon">
                  <i className="fas fa-hourglass-half"></i>
                </div>
                <div className="stat-content">
                  <h3>{statistics.pendingSubmissions}</h3>
                  <p>Pending Review</p>
                </div>
              </Card>

              <Card className="stat-card accepted">
                <div className="stat-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-content">
                  <h3>{statistics.acceptedSubmissions}</h3>
                  <p>Accepted</p>
                </div>
              </Card>

              <Card className="stat-card rejected">
                <div className="stat-icon">
                  <i className="fas fa-times-circle"></i>
                </div>
                <div className="stat-content">
                  <h3>{statistics.rejectedSubmissions}</h3>
                  <p>Rejected</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="stats-category">
            <h3>Performance Metrics</h3>
            <div className="metrics-grid">
              <Card className="metric-card">
                <div className="metric-header">
                  <i className="fas fa-percentage"></i>
                  <h4>Acceptance Rate</h4>
                </div>
                <div className="metric-value">
                  <span className="value">{calculateAcceptanceRate()}%</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill acceptance"
                      style={{ width: `${calculateAcceptanceRate()}%` }}
                    ></div>
                  </div>
                </div>
              </Card>

              <Card className="metric-card">
                <div className="metric-header">
                  <i className="fas fa-tasks"></i>
                  <h4>Review Completion</h4>
                </div>
                <div className="metric-value">
                  <span className="value">{calculateReviewCompletionRate()}%</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill review"
                      style={{ width: `${calculateReviewCompletionRate()}%` }}
                    ></div>
                  </div>
                  <span className="metric-detail">
                    {statistics.completedReviews} / {statistics.totalReviews} completed
                  </span>
                </div>
              </Card>

              <Card className="metric-card">
                <div className="metric-header">
                  <i className="fas fa-book"></i>
                  <h4>Published Issues</h4>
                </div>
                <div className="metric-value">
                  <span className="value">{statistics.publishedIssues}</span>
                  <span className="metric-detail">
                    out of {statistics.totalIssues} total issues
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-grid">
          {/* Recent Users */}
          <Card className="activity-card">
            <div className="card-header">
              <h2>
                <i className="fas fa-user-plus"></i> Recent Registrations
              </h2>
              <Link to="/admin/users" className="view-all-link">
                View All <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            {recentUsers.length > 0 ? (
              <div className="users-list">
                {recentUsers.map((user) => (
                  <div key={user._id} className="user-item">
                    <div className="user-avatar">
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="user-info">
                      <h4>{user.firstName} {user.lastName}</h4>
                      <p>{user.email}</p>
                      <div className="user-roles">
                        {user.roles.map((role, index) => (
                          <span key={index} className={`role-badge ${role}`}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="user-meta">
                      <span className="date">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No recent users</p>
            )}
          </Card>

          {/* Recent Submissions */}
          <Card className="activity-card">
            <div className="card-header">
              <h2>
                <i className="fas fa-file-alt"></i> Recent Submissions
              </h2>
              <Link to="/admin/submissions" className="view-all-link">
                View All <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            {recentSubmissions.length > 0 ? (
              <div className="submissions-list">
                {recentSubmissions.map((submission) => (
                  <div key={submission._id} className="submission-item">
                    <div className="submission-info">
                      <h4>{submission.title}</h4>
                      <p>
                        <i className="fas fa-user"></i>
                        {submission.authors?.[0]?.firstName} {submission.authors?.[0]?.lastName}
                      </p>
                      <span className={`status-badge ${submission.status}`}>
                        {submission.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="submission-meta">
                      <span className="date">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No recent submissions</p>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="quick-actions-card">
          <h2>
            <i className="fas fa-bolt"></i> Quick Actions
          </h2>
          <div className="quick-actions-grid">
            <Link to="/admin/users/create" className="quick-action">
              <div className="action-icon">
                <i className="fas fa-user-plus"></i>
              </div>
              <h3>Add New User</h3>
              <p>Create a new user account</p>
            </Link>

            <Link to="/admin/users?role=editor" className="quick-action">
              <div className="action-icon">
                <i className="fas fa-user-shield"></i>
              </div>
              <h3>Manage Editors</h3>
              <p>Assign editor roles</p>
            </Link>

            <Link to="/admin/submissions" className="quick-action">
              <div className="action-icon">
                <i className="fas fa-clipboard-list"></i>
              </div>
              <h3>View All Submissions</h3>
              <p>Monitor manuscript status</p>
            </Link>

            <Link to="/admin/analytics" className="quick-action">
              <div className="action-icon">
                <i className="fas fa-chart-bar"></i>
              </div>
              <h3>View Analytics</h3>
              <p>Detailed reports & insights</p>
            </Link>
          <Link to="/admin/doi/deposits" className="quick-action">
  <div className="action-icon">
    <i className="fas fa-link"></i>
  </div>
  <h3>DOI Management</h3>
  <p>Monitor DOI deposit status</p>
</Link>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
