import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout.jsx';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Card from '../../components/common/Card.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import './ReviewerDashboard.css';

const ReviewerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    pendingInvitations: 0,
    activeReviews: 0,
    completedReviews: 0,
    totalReviews: 0
  });
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [activeReviews, setActiveReviews] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch reviewer statistics
      const statsResponse = await api.get('/reviews/reviewer/statistics');
      setStatistics(statsResponse.data);

      // Fetch pending invitations
      const invitationsResponse = await api.get('/reviews/reviewer/invitations?status=pending');
      setPendingInvitations(invitationsResponse.data.slice(0, 5)); // Show top 5

      // Fetch active reviews
      const activeResponse = await api.get('/reviews/reviewer/reviews?status=in_progress');
      setActiveReviews(activeResponse.data.slice(0, 5)); // Show top 5

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationResponse = async (reviewId, response) => {
    try {
      await api.post(`/reviews/${reviewId}/respond`, { response });
      fetchDashboardData(); // Refresh data
    } catch (err) {
      console.error('Error responding to invitation:', err);
      alert(err.response?.data?.message || 'Failed to respond to invitation');
    }
  };

  const getDaysRemaining = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineStatus = (daysRemaining) => {
    if (daysRemaining < 0) return { text: 'Overdue', className: 'overdue', variant: 'danger' };
    if (daysRemaining <= 3) return { text: `${daysRemaining} days left`, className: 'urgent', variant: 'warning' };
    return { text: `${daysRemaining} days left`, className: 'normal', variant: 'info' };
  };

  if (loading) return <Loading />;

  return (
    <MainLayout>
      <div className="reviewer-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Reviewer Dashboard</h1>
            <p className="welcome-text">Welcome back, {user?.firstName}!</p>
          </div>
          <Link to="/reviewer/reviews" className="btn btn-outline">
            View All Reviews
          </Link>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Statistics Cards */}
        <div className="statistics-grid">
          <Card className="stat-card pending-card">
            <div className="stat-icon">
              <i className="fas fa-envelope"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.pendingInvitations}</h3>
              <p>Pending Invitations</p>
            </div>
          </Card>

          <Card className="stat-card active-card">
            <div className="stat-icon">
              <i className="fas fa-tasks"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.activeReviews}</h3>
              <p>Active Reviews</p>
            </div>
          </Card>

          <Card className="stat-card completed-card">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.completedReviews}</h3>
              <p>Completed Reviews</p>
            </div>
          </Card>

          <Card className="stat-card total-card">
            <div className="stat-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.totalReviews}</h3>
              <p>Total Reviews</p>
            </div>
          </Card>
        </div>

        {/* Pending Invitations Section */}
        {pendingInvitations.length > 0 && (
          <Card className="section-card">
            <div className="section-header">
              <h2>
                <i className="fas fa-inbox"></i> Pending Review Invitations
              </h2>
              <Link to="/reviewer/reviews?filter=invitations" className="view-all-link">
                View All <i className="fas fa-arrow-right"></i>
              </Link>
            </div>

            <div className="invitations-list">
              {pendingInvitations.map((review) => (
                <div key={review._id} className="invitation-item">
                  <div className="invitation-info">
                    <h3>{review.manuscript?.title || 'Untitled Manuscript'}</h3>
                    <div className="invitation-meta">
                      <span>
                        <i className="fas fa-user"></i> 
                        Invited by: {review.assignedBy?.firstName} {review.assignedBy?.lastName}
                      </span>
                      <span>
                        <i className="fas fa-calendar"></i> 
                        Invited: {new Date(review.invitedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="manuscript-abstract">
                      {review.manuscript?.abstract?.substring(0, 150)}...
                    </p>
                  </div>
                  <div className="invitation-actions">
                    <button
                      onClick={() => handleInvitationResponse(review._id, 'accepted')}
                      className="btn btn-success btn-sm"
                    >
                      <i className="fas fa-check"></i> Accept
                    </button>
                    <button
                      onClick={() => handleInvitationResponse(review._id, 'declined')}
                      className="btn btn-danger btn-sm"
                    >
                      <i className="fas fa-times"></i> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Active Reviews Section */}
        {activeReviews.length > 0 && (
          <Card className="section-card">
            <div className="section-header">
              <h2>
                <i className="fas fa-clipboard-list"></i> Active Reviews
              </h2>
              <Link to="/reviewer/reviews?filter=active" className="view-all-link">
                View All <i className="fas fa-arrow-right"></i>
              </Link>
            </div>

            <div className="active-reviews-list">
              {activeReviews.map((review) => {
                const daysRemaining = getDaysRemaining(review.deadline);
                const deadlineStatus = getDeadlineStatus(daysRemaining);

                return (
                  <div key={review._id} className="review-item">
                    <div className="review-info">
                      <h3>{review.manuscript?.title || 'Untitled Manuscript'}</h3>
                      <div className="review-meta">
                        <StatusBadge status={review.status} />
                        <span className={`deadline-badge ${deadlineStatus.className}`}>
                          <i className="fas fa-clock"></i> {deadlineStatus.text}
                        </span>
                      </div>
                      <div className="review-details">
                        <span>
                          <i className="fas fa-calendar-alt"></i> 
                          Assigned: {new Date(review.assignedAt).toLocaleDateString()}
                        </span>
                        <span>
                          <i className="fas fa-hourglass-end"></i> 
                          Deadline: {new Date(review.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="review-actions">
                      <Link 
                        to={`/reviewer/review/${review._id}`} 
                        className="btn btn-primary btn-sm"
                      >
                        <i className="fas fa-eye"></i> View & Review
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Empty State */}
        {pendingInvitations.length === 0 && activeReviews.length === 0 && (
          <Card className="empty-state">
            <i className="fas fa-inbox empty-icon"></i>
            <h3>No Pending Tasks</h3>
            <p>You have no pending review invitations or active reviews at the moment.</p>
            <Link to="/reviewer/reviews" className="btn btn-outline">
              View All Reviews
            </Link>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default ReviewerDashboard;