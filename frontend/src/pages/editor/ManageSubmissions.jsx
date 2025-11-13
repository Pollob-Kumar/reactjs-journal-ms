import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout.jsx';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Card from '../../components/common/Card.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import './ManageSubmissions.css';

const ManageSubmissions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSubmissions: 0,
    limit: 10
  });

  // Filters
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || 'submittedAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  });

  useEffect(() => {
    fetchSubmissions();
  }, [pagination.currentPage, filters]);

  const fetchSubmissions = async () => {
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

      const response = await api.get('/manuscripts', { params });

      setSubmissions(response.data.manuscripts || response.data);
      setPagination({
        ...pagination,
        totalPages: response.data.totalPages || 1,
        totalSubmissions: response.data.total || response.data.length,
        currentPage: response.data.currentPage || 1
      });

    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError(err.response?.data?.message || 'Failed to load submissions');
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
    fetchSubmissions();
  };

  const getActionButton = (submission) => {
    switch (submission.status) {
      case 'submitted':
        return (
          <Link
            to={`/editor/submission/${submission._id}/assign`}
            className="btn btn-primary btn-sm"
          >
            <i className="fas fa-user-plus"></i> Assign Reviewers
          </Link>
        );
      case 'under_review':
        return (
          <Link
            to={`/editor/submission/${submission._id}/reviews`}
            className="btn btn-outline btn-sm"
          >
            <i className="fas fa-tasks"></i> Track Reviews
          </Link>
        );
      case 'review_completed':
        return (
          <Link
            to={`/editor/submission/${submission._id}/decision`}
            className="btn btn-success btn-sm"
          >
            <i className="fas fa-gavel"></i> Make Decision
          </Link>
        );
      case 'revision_required':
        return (
          <Link
            to={`/editor/submission/${submission._id}`}
            className="btn btn-warning btn-sm"
          >
            <i className="fas fa-sync"></i> View Revision
          </Link>
        );
      case 'accepted':
        return (
          <Link
            to={`/editor/submission/${submission._id}`}
            className="btn btn-outline btn-sm"
          >
            <i className="fas fa-check-circle"></i> Accepted
          </Link>
        );
      default:
        return (
          <Link
            to={`/editor/submission/${submission._id}`}
            className="btn btn-outline btn-sm"
          >
            <i className="fas fa-eye"></i> View
          </Link>
        );
    }
  };

  if (loading && submissions.length === 0) return <Loading />;

  return (
    <MainLayout>
      <div className="manage-submissions">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Manage Submissions</h1>
            <p className="page-description">
              Review and manage all manuscript submissions
            </p>
          </div>
          <div className="header-stats">
            <div className="stat-pill">
              <span className="stat-value">{pagination.totalSubmissions}</span>
              <span className="stat-label">Total Submissions</span>
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
                  placeholder="Search by title, author, or manuscript ID..."
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
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="review_completed">Review Completed</option>
                <option value="revision_required">Revision Required</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="published">Published</option>
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
                <option value="submittedAt">Submission Date</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
                <option value="updatedAt">Last Updated</option>
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

        {/* Submissions Table */}
        {submissions.length > 0 ? (
          <>
            <Card className="table-card">
              <div className="table-responsive">
                <table className="submissions-table">
                  <thead>
                    <tr>
                      <th>Manuscript ID</th>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission._id}>
                        <td>
                          <span className="manuscript-id-badge">
                            {submission.manuscriptId}
                          </span>
                        </td>
                        <td>
                          <div className="title-cell">
                            <Link
                              to={`/editor/submission/${submission._id}`}
                              className="title-link"
                            >
                              {submission.title}
                            </Link>
                            {submission.keywords && submission.keywords.length > 0 && (
                              <div className="keywords-preview">
                                {submission.keywords.slice(0, 3).map((keyword, index) => (
                                  <span key={index} className="keyword-tag-sm">
                                    {keyword}
                                  </span>
                                ))}
                                {submission.keywords.length > 3 && (
                                  <span className="keyword-tag-sm more">
                                    +{submission.keywords.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="author-cell">
                            <i className="fas fa-user"></i>
                            <span>
                              {submission.authors?.[0]?.firstName}{' '}
                              {submission.authors?.[0]?.lastName}
                            </span>
                            {submission.authors && submission.authors.length > 1 && (
                              <span className="co-authors-count">
                                +{submission.authors.length - 1}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="date-cell">
                            <i className="fas fa-calendar"></i>
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={submission.status} />
                        </td>
                        <td>
                          <div className="actions-cell">
                            <Link
                              to={`/editor/submission/${submission._id}`}
                              className="btn btn-icon"
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </Link>
                            {getActionButton(submission)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

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
            <i className="fas fa-folder-open empty-icon"></i>
            <h3>No Submissions Found</h3>
            <p>
              {filters.status !== 'all' || filters.search
                ? 'Try adjusting your filters to see more results.'
                : 'There are no submissions in the system yet.'}
            </p>
            {(filters.status !== 'all' || filters.search) && (
              <button
                onClick={() => {
                  setFilters({ status: 'all', search: '', sortBy: 'submittedAt', sortOrder: 'desc' });
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

export default ManageSubmissions;