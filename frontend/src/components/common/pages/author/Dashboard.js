import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaPlusCircle, FaBook, FaChartLine } from 'react-icons/fa';
import manuscriptService from '../../services/manuscriptService';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import './Dashboard.css';

const AuthorDashboard = () => {
  const { user } = useAuth();

  // Fetch manuscripts
  const { data: manuscriptsData, isLoading: manuscriptsLoading, error: manuscriptsError } = useQuery(
    'author-manuscripts',
    () => manuscriptService.getManuscripts({ page: 1, limit: 5 })
  );

  // Fetch user statistics
  const { data: statsData, isLoading: statsLoading } = useQuery(
    ['user-stats', user.id],
    () => userService.getUserStats(user.id)
  );

  if (manuscriptsLoading || statsLoading) {
    return <Loading message="Loading dashboard..." />;
  }

  if (manuscriptsError) {
    return <ErrorMessage message="Failed to load dashboard data" />;
  }

  const manuscripts = manuscriptsData?.data || [];
  const stats = statsData?.data?.author || {};

  return (
    <div className="author-dashboard">
      <div className="dashboard-header">
        <h1>Author Dashboard</h1>
        <p>Welcome back, {user.fullName}!</p>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/author/submit" className="action-card action-primary">
          <FaPlusCircle className="action-icon" />
          <h3>Submit New Manuscript</h3>
          <p>Start a new submission</p>
        </Link>
        <Link to="/author/submissions" className="action-card">
          <FaBook className="action-icon" />
          <h3>My Submissions</h3>
          <p>View all manuscripts</p>
        </Link>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon stat-primary">
              <FaFileAlt />
            </div>
            <div className="stat-info">
              <h3>{stats.totalSubmissions || 0}</h3>
              <p>Total Submissions</p>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon stat-success">
              <FaChartLine />
            </div>
            <div className="stat-info">
              <h3>{stats.acceptedPapers || 0}</h3>
              <p>Accepted Papers</p>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon stat-info">
              <FaBook />
            </div>
            <div className="stat-info">
              <h3>{stats.publishedPapers || 0}</h3>
              <p>Published Papers</p>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon stat-warning">
              <FaChartLine />
            </div>
            <div className="stat-info">
              <h3>{stats.acceptanceRate || '0%'}</h3>
              <p>Acceptance Rate</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card 
        title="Recent Submissions" 
        actions={
          <Link to="/author/submissions" className="btn btn-sm btn-outline">
            View All
          </Link>
        }
      >
        {manuscripts.length === 0 ? (
          <div className="empty-state">
            <FaFileAlt className="empty-icon" />
            <h3>No Submissions Yet</h3>
            <p>You haven't submitted any manuscripts yet.</p>
            <Link to="/author/submit" className="btn btn-primary mt-3">
              Submit Your First Manuscript
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Manuscript ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {manuscripts.map(manuscript => (
                  <tr key={manuscript._id}>
                    <td>{manuscript.manuscriptId}</td>
                    <td className="manuscript-title">{manuscript.title}</td>
                    <td>
                      <StatusBadge status={manuscript.status} />
                    </td>
                    <td>{new Date(manuscript.submissionDate).toLocaleDateString()}</td>
                    <td>
                      <Link 
                        to={`/author/manuscript/${manuscript._id}`}
                        className="btn btn-sm btn-primary"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuthorDashboard;