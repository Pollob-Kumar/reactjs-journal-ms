import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout.jsx';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Card from '../../components/common/Card.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import './MyReviews.css';

const MyReviews = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReviews: 0,
    limit: 10
  });

  // Filters
  const [filters, setFilters] = useState({
    status: searchParams.get('filter') === 'invitations' ? 'pending_invitation' :
            searchParams.get('filter') === 'active' ? 'in_progress' :
            searchParams.get('status') || 'all',
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || 'deadline',
    sortOrder: searchParams.get('sortOrder') || 'asc'
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

      const response = await api.get('/reviews/reviewer/reviews', { params });

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
    
    // Update URL params
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

  const getDaysRemaining = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineStatus = (daysRemaining) => {
    if (daysRemaining < 0) return { text: 'Overdue', className: 'overdue' };
    if (daysRemaining <= 3) return { text: `${daysRemaining} days left`, className: 'urgent' };
    return { text: `${daysRemaining} days left`, className: 'normal' };
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'pending_invitation': 'Invitation Pending',
      'accepted': 'Accepted',
      'declined': 'Declined',
      'in_progress': 'In Progress',
      'completed': 'Completed'
    };
    return statusMap[status] || status;
  };

  if (loading && reviews.length === 0) return <Loading />;

  return (
    <MainLayout>
      <div className="my-reviews">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>My Reviews</h1>
            <p className="page-description">
              Manage all your review assignments and invitations
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
                  placeholder="Search by manuscript title..."
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
                <option value="deadline">Deadline</option>
                <option value="assignedAt">Assigned Date</option>
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
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Reviews List */}
        {reviews.length > 0 ? (
          <>
            <div className="reviews-list">
              {reviews.map((review) => {
                const daysRemaining = review.deadline ? getDaysRemaining(review.deadline) : null;
                const deadlineStatus = daysRemaining !== null ? getDeadlineStatus(daysRemaining) : null;

                return (
                  <Card key={review._id} className="review-card">
                    <div className="review-card-header">
                      <div className="review-title-section">
                        <h3>{review.manuscript?.title || 'Untitled Manuscript'}</h3>
                        <div className="review-badges">
                          <StatusBadge status={review.status} label={getStatusLabel(review.status)} />
                          {deadlineStatus && review.status === 'in_progress' && (
                            <span className={`deadline-badge ${deadlineStatus.className}`}>
                              <i className="fas fa-clock"></i> {deadlineStatus.text}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="review-actions">
                        {review.status === 'pending_invitation' && (
                          <Link
                            to={`/reviewer/review/${review._id}`}
                            className="btn btn-outline btn-sm"
                          >
                            <i className="fas fa-envelope-open"></i> View Invitation
                          </Link>
                        )}
                        {review.status === 'in_progress' && (
                          <Link
                            to={`/reviewer/review/${review._id}`}
                            className="btn btn-primary btn-sm"
                          >
                            <i className="fas fa-edit"></i> Continue Review
                          </Link>
                        )}
                        {review.status === 'completed' && (
                          <Link
                            to={`/reviewer/review/${review._id}`}
                            className="btn btn-outline btn-sm"
                          >
                            <i className="fas fa-eye"></i> View Review
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="review-card-body">
                      <div className="review-meta-grid">
                        <div className="meta-item">
                          <i className="fas fa-user-tie"></i>
                          <div>
                            <span className="meta-label">Assigned By</span>
                            <span className="meta-value">
                              {review.assignedBy?.firstName} {review.assignedBy?.lastName}
                            </span>
                          </div>
                        </div>

                        <div className="meta-item">
                          <i className="fas fa-calendar-plus"></i>
                          <div>
                            <span className="meta-label">Assigned On</span>
                            <span className="meta-value">
                              {new Date(review.assignedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {review.deadline && (
                          <div className="meta-item">
                            <i className="fas fa-hourglass-end"></i>
                            <div>
                              <span className="meta-label">Deadline</span>
                              <span className="meta-value">
                                {new Date(review.deadline).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}

                        {review.completedAt && (
                          <div className="meta-item">
                            <i className="fas fa-check-circle"></i>
                            <div>
                              <span className="meta-label">Completed On</span>
                              <span className="meta-value">
                                {new Date(review.completedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {review.manuscript?.abstract && (
                        <div className="manuscript-preview">
                          <strong>Abstract Preview:</strong>
                          <p>{review.manuscript.abstract.substring(0, 200)}...</p>
                        </div>
                      )}
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
                : 'You have no review assignments yet.'}
            </p>
            {(filters.status !== 'all' || filters.search) && (
              <button
                onClick={() => {
                  setFilters({ status: 'all', search: '', sortBy: 'deadline', sortOrder: 'asc' });
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

export default MyReviews;