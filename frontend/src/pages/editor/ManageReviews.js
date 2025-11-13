import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import './ManageReviews.css';

const ManageReviews = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReviews: 0,
    limit: 15
  });

  // Filters
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || 'assignedAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  });

  useEffect(() => {
    fetchReviews();
  }, [pagination.currentPage, filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      if (filters.status !== 'all') {
        params.status = filters.status;
      }

      if (filters.search) {
        params.search = filters.search;
      }

      const response = await api.get('/reviews/editor/all', { params });

      setReviews(response.data.reviews || response.data);
      setPagination({
        ...pagination,
        totalPages: response.data.totalPages || 1,
        totalReviews: response.data.total || response.data.length,
        currentPage: response.data.currentPage || 1
      });

    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, currentPage: 1 });
    
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    setPagination({ ...pagination, currentPage: page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReviews();
  };

  const handleSendReminder = async (reviewId) => {
    try {
      await api.post(`/reviews/${reviewId}/reminder`);
      alert('Reminder sent successfully!');
    } catch (err) {
      console.error('Error sending reminder:', err);
      alert(err.response?.data?.message || 'Failed to send reminder');
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
    if (daysRemaining < 0) return { text: `${Math.abs(daysRemaining)} days overdue`, className: 'overdue' };
    if (daysRemaining <= 3) return { text: `${daysRemaining} days left`, className: 'urgent' };
    return { text: `${daysRemaining} days left`, className: 'normal' };
  };

  if (loading && reviews.length === 0) return <Loading />;

  return (
    <MainLayout>
      <div className="manage-reviews">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Manage Reviews</h1>
            <p className="page-description">
              Track and manage all reviewer assignments
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-pill">
              <span className="stat-value">{pagination.totalReviews}</span>
              <span className="stat-label">Total Reviews</span>
            </div>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Filters Section */}
        <Card className="filters-card">
          <div className="filters-row">
            {/* Search */}
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-group">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by manuscript title or reviewer name..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </form>

            {/* Status Filter */}
            <div className="filter-group">
              <label htmlFor="status-filter">Status:</label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending_invitation">Pending Invitation</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="filter-group">
              <label htmlFor="sort-filter">Sort By:</label>
              <select
                id="sort-filter"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="filter-select"
              >
                <option value="assignedAt">Assigned Date</option>
                <option value="deadline">Deadline</option>
                <option value="status">Status</option>
                <option value="completedAt">Completion Date</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="filter-group">
              <label htmlFor="order-filter">Order:</label>
              <select
                id="order-filter"
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="filter-select"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <>
            <div className="reviews-grid">
              {reviews.map((review) => {
                const daysRemaining = review.deadline ? getDaysRemaining(review.deadline) : null;
                const deadlineStatus = daysRemaining !== null ? getDeadlineStatus(daysRemaining) : null;

                return (
                  <Card key={review._id} className="review-card">
                    <div className="review-card-header">
                      <div className="manuscript-info">
                        <h3>
                          <Link to={`/editor/submission/${review.manuscript?._id}`}>
                            {review.manuscript?.title || 'Untitled Manuscript'}
                          </Link>
                        </h3>
                        <span className="manuscript-id">
                          {review.manuscript?.manuscriptId}
                        </span>
                      </div>
                      <StatusBadge status={review.status} />
                    </div>

                    <div className="review-card-body">
                      {/* Reviewer Info */}
                      <div className="reviewer-section">
                        <div className="reviewer-avatar">
                          <i className="fas fa-user-tie"></i>
                        </div>
                        <div className="reviewer-details">
                          <h4>
                            {review.reviewer?.firstName} {review.reviewer?.lastName}
                          </h4>
                          <p>{review.reviewer?.email}</p>
                          {review.reviewer?.affiliation && (
                            <p className="affiliation">
                              <i className="fas fa-building"></i> {review.reviewer.affiliation}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="review-timeline">
                        <div className="timeline-item">
                          <i className="fas fa-calendar-plus"></i>
                          <div>
                            <span className="timeline-label">Assigned</span>
                            <span className="timeline-value">
                              {new Date(review.assignedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {review.acceptedAt && (
                          <div className="timeline-item">
                            <i className="fas fa-check"></i>
                            <div>
                              <span className="timeline-label">Accepted</span>
                              <span className="timeline-value">
                                {new Date(review.acceptedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}

                        {review.deadline && (
                          <div className="timeline-item">
                            <i className="fas fa-hourglass-end"></i>
                            <div>
                              <span className="timeline-label">Deadline</span>
                              <span className="timeline-value">
                                {new Date(review.deadline).toLocaleDateString()}
                              </span>
                              {deadlineStatus && review.status !== 'completed' && (
                                <span className={`deadline-badge ${deadlineStatus.className}`}>
                                  {deadlineStatus.text}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {review.completedAt && (
                          <div className="timeline-item">
                            <i className="fas fa-check-circle"></i>
                            <div>
                              <span className="timeline-label">Completed</span>
                              <span className="timeline-value">
                                {new Date(review.completedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="review-actions">
                        {review.status === 'completed' && (
                          <Link
                            to={`/editor/review/${review._id}`}
                            className="btn btn-primary btn-sm"
                          >
                            <i className="fas fa-eye"></i> View Review
                          </Link>
                        )}
                        {(review.status === 'in_progress' || review.status === 'accepted') && (
                          <button
                            onClick={() => handleSendReminder(review._id)}
                            className="btn btn-warning btn-sm"
                          >
                            <i className="fas fa-bell"></i> Send Reminder
                          </button>
                        )}
                        {review.status === 'pending_invitation' && (
                          <span className="status-note">
                            <i className="fas fa-info-circle"></i> Awaiting response
                          </span>
                        )}
                        {review.status === 'declined' && (
                          <span className="status-note declined">
                            <i className="fas fa-times-circle"></i> Declined by reviewer
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <Card className="empty-state">
            <i className="fas fa-clipboard-list empty-icon"></i>
            <h3>No Reviews Found</h3>
            <p>
              {filters.status !== 'all' || filters.search
                ? 'Try adjusting your filters to see more results.'
                : 'There are no review assignments in the system yet.'}
            </p>
            {(filters.status !== 'all' || filters.search) && (
              <button
                onClick={() => {
                  setFilters({ status: 'all', search: '', sortBy: 'assignedAt', sortOrder: 'desc' });
                  setSearchParams({});
                }}
                className="btn btn-outline"
              >
                Clear Filters
              </button>
            )}
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default ManageReviews;