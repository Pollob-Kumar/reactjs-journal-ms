import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout.jsx';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Card from '../../components/common/Card.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import './EditorDashboard.css';

const EditorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    totalSubmissions: 0,
    pendingAssignment: 0,
    underReview: 0,
    reviewsCompleted: 0,
    pendingDecision: 0,
    accepted: 0,
    rejected: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch editor statistics
      const statsResponse = await api.get('/manuscripts/editor/statistics');
      setStatistics(statsResponse.data);

      // Fetch recent submissions (last 5)
      const submissionsResponse = await api.get('/manuscripts?limit=5&sortBy=submittedAt&sortOrder=desc');
      setRecentSubmissions(submissionsResponse.data.manuscripts || submissionsResponse.data);

      // Fetch pending reviews
      const reviewsResponse = await api.get('/reviews/editor/pending');
      setPendingReviews(reviewsResponse.data.slice(0, 5)); // Top 5 pending reviews

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatusColor = (status) => {
    const colorMap = {
      'submitted': '#4299e1',
      'under_review': '#ed8936',
      'revision_required': '#f6ad55',
      'accepted': '#48bb78',
      'rejected': '#f56565'
    };
    return colorMap[status] || '#718096';
  };

  if (loading) return <Loading />;

  return (
    <MainLayout>
      <div className="editor-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Editor Dashboard</h1>
            <p className="welcome-text">Welcome, {user?.firstName}!</p>
          </div>
          <div className="header-actions">
            <Link to="/editor/submissions" className="btn btn-primary">
              <i className="fas fa-list"></i> All Submissions
            </Link>
            <Link to="/editor/issues" className="btn btn-outline">
              <i className="fas fa-book"></i> Manage Issues
            </Link>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Statistics Grid */}
        <div className="statistics-grid">
          <Card className="stat-card total-card">
            <div className="stat-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.totalSubmissions}</h3>
              <p>Total Submissions</p>
            </div>
          </Card>

          <Card className="stat-card pending-card">
            <div className="stat-icon">
              <i className="fas fa-hourglass-half"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.pendingAssignment}</h3>
              <p>Pending Assignment</p>
            </div>
            <Link to="/editor/submissions?status=submitted" className="stat-link">
              View <i className="fas fa-arrow-right"></i>
            </Link>
          </Card>

          <Card className="stat-card review-card">
            <div className="stat-icon">
              <i className="fas fa-search"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.underReview}</h3>
              <p>Under Review</p>
            </div>
            <Link to="/editor/submissions?status=under_review" className="stat-link">
              View <i className="fas fa-arrow-right"></i>
            </Link>
          </Card>

          <Card className="stat-card decision-card">
            <div className="stat-icon">
              <i className="fas fa-gavel"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.pendingDecision}</h3>
              <p>Pending Decision</p>
            </div>
            <Link to="/editor/submissions?status=review_completed" className="stat-link">
              View <i className="fas fa-arrow-right"></i>
            </Link>
          </Card>

          <Card className="stat-card accepted-card">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.accepted}</h3>
              <p>Accepted</p>
            </div>
          </Card>

          <Card className="stat-card rejected-card">
            <div className="stat-icon">
              <i className="fas fa-times-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.rejected}</h3>
              <p>Rejected</p>
            </div>
          </Card>
        </div>

        {/* Submission Pipeline Visualization */}
        <Card className="pipeline-card">
          <div className="section-header">
            <h2>
              <i className="fas fa-project-diagram"></i> Submission Pipeline
            </h2>
          </div>
          <div className="pipeline">
            <div className="pipeline-stage">
              <div className="stage-count">{statistics.pendingAssignment}</div>
              <div className="stage-label">New Submissions</div>
              <div className="stage-icon">
                <i className="fas fa-inbox"></i>
              </div>
            </div>
            <div className="pipeline-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
            <div className="pipeline-stage">
              <div className="stage-count">{statistics.underReview}</div>
              <div className="stage-label">Under Review</div>
              <div className="stage-icon">
                <i className="fas fa-search"></i>
              </div>
            </div>
            <div className="pipeline-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
            <div className="pipeline-stage">
              <div className="stage-count">{statistics.pendingDecision}</div>
              <div className="stage-label">Pending Decision</div>
              <div className="stage-icon">
                <i className="fas fa-balance-scale"></i>
              </div>
            </div>
            <div className="pipeline-arrow">
              <i className="fas fa-arrow-right"></i>
            </div>
            <div className="pipeline-stage success">
              <div className="stage-count">{statistics.accepted}</div>
              <div className="stage-label">Accepted</div>
              <div className="stage-icon">
                <i className="fas fa-check"></i>
              </div>
            </div>
          </div>
        </Card>

        <div className="dashboard-grid">
          {/* Recent Submissions */}
          <Card className="section-card">
            <div className="section-header">
              <h2>
                <i className="fas fa-clock"></i> Recent Submissions
              </h2>
              <Link to="/editor/submissions" className="view-all-link">
                View All <i className="fas fa-arrow-right"></i>
              </Link>
            </div>

            {recentSubmissions.length > 0 ? (
              <div className="submissions-list">
                {recentSubmissions.map((submission) => (
                  <div key={submission._id} className="submission-item">
                    <div className="submission-header">
                      <h3>{submission.title}</h3>
                      <StatusBadge status={submission.status} />
                    </div>
                    <div className="submission-meta">
                      <span>
                        <i className="fas fa-user"></i>
                        {submission.authors?.[0]?.firstName} {submission.authors?.[0]?.lastName}
                      </span>
                      <span>
                        <i className="fas fa-calendar"></i>
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                      <span>
                        <i className="fas fa-hashtag"></i>
                        {submission.manuscriptId}
                      </span>
                    </div>
                    <div className="submission-actions">
                      <Link
                        to={`/editor/submission/${submission._id}`}
                        className="btn btn-sm btn-outline"
                      >
                        <i className="fas fa-eye"></i> View
                      </Link>
                      {submission.status === 'submitted' && (
                        <Link
                          to={`/editor/submission/${submission._id}/assign`}
                          className="btn btn-sm btn-primary"
                        >
                          <i className="fas fa-user-plus"></i> Assign Reviewers
                        </Link>
                      )}
                      {submission.status === 'review_completed' && (
                        <Link
                          to={`/editor/submission/${submission._id}/decision`}
                          className="btn btn-sm btn-success"
                        >
                          <i className="fas fa-gavel"></i> Make Decision
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-message">
                <i className="fas fa-inbox"></i>
                <p>No recent submissions</p>
              </div>
            )}
          </Card>

          {/* Pending Reviews Status */}
          <Card className="section-card">
            <div className="section-header">
              <h2>
                <i className="fas fa-tasks"></i> Review Progress
              </h2>
              <Link to="/editor/reviews" className="view-all-link">
                View All <i className="fas fa-arrow-right"></i>
              </Link>
            </div>

            {pendingReviews.length > 0 ? (
              <div className="reviews-progress-list">
                {pendingReviews.map((review) => (
                  <div key={review._id} className="review-progress-item">
                    <div className="review-info">
                      <h4>{review.manuscript?.title || 'Untitled'}</h4>
                      <div className="reviewer-info">
                        <i className="fas fa-user-tie"></i>
                        <span>
                          {review.reviewer?.firstName} {review.reviewer?.lastName}
                        </span>
                      </div>
                    </div>
                    <div className="review-status">
                      <StatusBadge status={review.status} />
                      {review.deadline && (
                        <span className="deadline-text">
                          Due: {new Date(review.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-message">
                <i className="fas fa-check-circle"></i>
                <p>No pending reviews</p>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="quick-actions-card">
          <div className="section-header">
            <h2>
              <i className="fas fa-bolt"></i> Quick Actions
            </h2>
          </div>
          <div className="quick-actions-grid">
            <Link to="/editor/submissions?status=submitted" className="quick-action">
              <div className="action-icon pending">
                <i className="fas fa-user-plus"></i>
              </div>
              <div className="action-text">
                <h3>Assign Reviewers</h3>
                <p>Review new submissions</p>
              </div>
            </Link>

            <Link to="/editor/submissions?status=review_completed" className="quick-action">
              <div className="action-icon decision">
                <i className="fas fa-gavel"></i>
              </div>
              <div className="action-text">
                <h3>Make Decisions</h3>
                <p>Finalize reviewed papers</p>
              </div>
            </Link>

            <Link to="/editor/reviews" className="quick-action">
              <div className="action-icon review">
                <i className="fas fa-clipboard-list"></i>
              </div>
              <div className="action-text">
                <h3>Track Reviews</h3>
                <p>Monitor review progress</p>
              </div>
            </Link>

            <Link to="/editor/issues" className="quick-action">
              <div className="action-icon publish">
                <i className="fas fa-book-open"></i>
              </div>
              <div className="action-text">
                <h3>Manage Issues</h3>
                <p>Create and publish issues</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default EditorDashboard;