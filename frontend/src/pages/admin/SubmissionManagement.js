import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './SubmissionManagement.css';

const SubmissionManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSubmissions: 0,
    limit: 15
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

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

      const response = await api.get('/admin/submissions', { params });

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

  const handleDeleteSubmission = async () => {
    try {
      await api.delete(`/admin/submissions/${selectedSubmission._id}`);
      alert('Submission deleted successfully!');
      setShowDeleteDialog(false);
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (err) {
      console.error('Error deleting submission:', err);
      alert(err.response?.data?.message || 'Failed to delete submission');
    }
  };

  const openDeleteDialog = (submission) => {
    setSelectedSubmission(submission);
    setShowDeleteDialog(true);
  };

  if (loading && submissions.length === 0) return <Loading />;

  return (
    <MainLayout>
      <div className="submission-management">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Submission Management</h1>
            <p className="page-description">
              View and manage all manuscript submissions in the system
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
                      <th>ID</th>
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
                            <h4>{submission.title}</h4>
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
                            <div>
                              <p className="author-name">
                                {submission.authors?.[0]?.firstName}{' '}
                                {submission.authors?.[0]?.lastName}
                              </p>
                              <p className="author-email">
                                {submission.submittedBy?.email}
                              </p>
                            </div>
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
                              to={`/admin/submission/${submission._id}`}
                              className="btn-icon"
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </Link>
                            <button
                              onClick={() => openDeleteDialog(submission)}
                              className="btn-icon danger"
                              title="Delete Submission"
                            >
                              <i className="fas fa-trash"></i>
                              <Link
                                  to={`/admin/manuscripts/${manuscript._id}/revisions`}
                                  className="btn btn-outline btn-sm"
                                  title="View Revision History"
                                >
                                  <i className="fas fa-history"></i> Revisions
                                </Link>
                            </button>
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

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && selectedSubmission && (
          <ConfirmDialog
            title="Delete Submission"
            message={`Are you sure you want to delete "${selectedSubmission.title}"? This action cannot be undone and will remove all associated reviews and files.`}
            confirmText="Delete"
            confirmVariant="danger"
            onConfirm={handleDeleteSubmission}
            onCancel={() => {
              setShowDeleteDialog(false);
              setSelectedSubmission(null);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default SubmissionManagement;
