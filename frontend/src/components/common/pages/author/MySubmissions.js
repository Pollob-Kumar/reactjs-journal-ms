import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { FaEye, FaEdit, FaTrash, FaFilter } from 'react-icons/fa';
import manuscriptService from '../../services/manuscriptService';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { toast } from 'react-toastify';
import './MySubmissions.css';

const MySubmissions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data, isLoading, error, refetch } = useQuery(
    ['author-manuscripts', currentPage, statusFilter, searchTerm],
    () => manuscriptService.getManuscripts({
      page: currentPage,
      limit: 10,
      status: statusFilter,
      search: searchTerm
    })
  );

  const handleDelete = async () => {
    try {
      await manuscriptService.deleteManuscript(deleteId);
      toast.success('Manuscript deleted successfully');
      refetch();
      setShowDeleteDialog(false);
      setDeleteId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete manuscript');
    }
  };

  const openDeleteDialog = (id) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  if (isLoading) {
    return <Loading message="Loading submissions..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load submissions" onRetry={refetch} />;
  }

  const manuscripts = data?.data || [];
  const pagination = data?.pagination || {};

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'Under Review', label: 'Under Review' },
    { value: 'Revisions Required', label: 'Revisions Required' },
    { value: 'Revised Submitted', label: 'Revised Submitted' },
    { value: 'Accepted', label: 'Accepted' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Published', label: 'Published' }
  ];

  return (
    <div className="my-submissions">
      <div className="page-header">
        <div>
          <h1>My Submissions</h1>
          <p>Manage and track all your manuscript submissions</p>
        </div>
        <Link to="/author/submit" className="btn btn-primary">
          Submit New Manuscript
        </Link>
      </div>

      <Card>
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              className="form-control"
              placeholder="Search by title or manuscript ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {manuscripts.length === 0 ? (
          <div className="empty-state">
            <h3>No Submissions Found</h3>
            <p>
              {searchTerm || statusFilter
                ? 'No manuscripts match your search criteria.'
                : 'You haven\'t submitted any manuscripts yet.'}
            </p>
            {!searchTerm && !statusFilter && (
              <Link to="/author/submit" className="btn btn-primary mt-3">
                Submit Your First Manuscript
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Manuscript ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {manuscripts.map(manuscript => (
                    <tr key={manuscript._id}>
                      <td>
                        <strong>{manuscript.manuscriptId}</strong>
                      </td>
                      <td className="manuscript-title">
                        {manuscript.title}
                      </td>
                      <td>
                        <StatusBadge status={manuscript.status} />
                      </td>
                      <td>
                        {new Date(manuscript.submissionDate).toLocaleDateString()}
                      </td>
                      <td>
                        {new Date(manuscript.lastUpdated).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            to={`/author/manuscript/${manuscript._id}`}
                            className="btn btn-sm btn-primary"
                            title="View Details"
                          >
                            <FaEye />
                          </Link>
                          
                          {manuscript.status === 'Revisions Required' && (
                            <Link
                              to={`/author/manuscript/${manuscript._id}/revise`}
                              className="btn btn-sm btn-warning"
                              title="Submit Revision"
                            >
                              <FaEdit />
                            </Link>
                          )}
                          
                          {manuscript.status !== 'Published' && (
                            <button
                              className="btn btn-sm btn-danger"
                              title="Delete Manuscript"
                              onClick={() => openDeleteDialog(manuscript._id)}
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </Card>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeleteId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Manuscript"
        message="Are you sure you want to delete this manuscript? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default MySubmissions;