// frontend/src/components/common/pages/admin/DoiDeposits.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout.jsx';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Card from '../../components/common/Card.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import './DoiDeposits.css';

const DoiDeposits = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manuscripts, setManuscripts] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    not_assigned: 0,
    pending: 0,
    processing: 0,
    success: 0,
    failed: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 20
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedManuscript, setSelectedManuscript] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showManualAssignModal, setShowManualAssignModal] = useState(false);
  const [manualDoi, setManualDoi] = useState('');
  const [showBulkRetryDialog, setShowBulkRetryDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDeposits();
  }, [pagination.currentPage, statusFilter]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/admin/doi/deposits', {
        params: {
          status: statusFilter,
          page: pagination.currentPage,
          limit: pagination.limit
        }
      });

      setManuscripts(response.data.data.manuscripts);
      setStatistics(response.data.data.statistics);
      setPagination(response.data.data.pagination);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching DOI deposits:', err);
      setError(err.response?.data?.message || 'Failed to load DOI deposits');
      setLoading(false);
    }
  };

  const handleViewDetails = async (manuscriptId) => {
    try {
      setActionLoading(true);
      const response = await api.get(`/admin/doi/deposits/${manuscriptId}`);
      setSelectedManuscript(response.data.data);
      setShowDetailsModal(true);
      setActionLoading(false);
    } catch (err) {
      console.error('Error fetching deposit details:', err);
      alert(err.response?.data?.message || 'Failed to load deposit details');
      setActionLoading(false);
    }
  };

  const handleRetry = async (manuscriptId) => {
    try {
      setActionLoading(true);
      const response = await api.post(`/admin/doi/deposits/${manuscriptId}/retry`);
      alert(response.data.message);
      fetchDeposits();
      setActionLoading(false);
    } catch (err) {
      console.error('Error retrying DOI deposit:', err);
      alert(err.response?.data?.message || 'Failed to retry DOI deposit');
      setActionLoading(false);
    }
  };

  const handleManualAssign = async () => {
    if (!manualDoi.trim()) {
      alert('Please enter a DOI');
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.post(
        `/admin/doi/deposits/${selectedManuscript._id}/assign`,
        { doi: manualDoi }
      );
      alert(response.data.message);
      setShowManualAssignModal(false);
      setManualDoi('');
      fetchDeposits();
      setActionLoading(false);
    } catch (err) {
      console.error('Error assigning DOI:', err);
      alert(err.response?.data?.message || 'Failed to assign DOI');
      setActionLoading(false);
    }
  };

  const handleBulkRetry = async () => {
    try {
      setActionLoading(true);
      const response = await api.post('/admin/doi/deposits/bulk-retry');
      alert(response.data.message);
      setShowBulkRetryDialog(false);
      fetchDeposits();
      setActionLoading(false);
    } catch (err) {
      console.error('Error bulk retrying:', err);
      alert(err.response?.data?.message || 'Failed to bulk retry');
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      not_assigned: 'status-not-assigned',
      pending: 'status-pending',
      processing: 'status-processing',
      success: 'status-success',
      failed: 'status-failed'
    };
    return classes[status] || 'status-default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      not_assigned: 'fa-circle',
      pending: 'fa-clock',
      processing: 'fa-spinner fa-spin',
      success: 'fa-check-circle',
      failed: 'fa-times-circle'
    };
    return icons[status] || 'fa-circle';
  };

  const formatStatusText = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading && manuscripts.length === 0) return <Loading />;

  return (
    <MainLayout>
      <div className="doi-deposits">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>DOI Deposit Management</h1>
            <p className="page-description">
              Monitor and manage DOI assignments for published articles
            </p>
          </div>
          <div className="header-actions">
            <button
              onClick={() => setShowBulkRetryDialog(true)}
              className="btn btn-primary"
              disabled={statistics.failed === 0}
            >
              <i className="fas fa-sync"></i> Bulk Retry Failed ({statistics.failed})
            </button>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Statistics Cards */}
        <div className="stats-grid">
          <Card className="stat-card stat-total">
            <div className="stat-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.total}</h3>
              <p>Total Published</p>
            </div>
          </Card>

          <Card className="stat-card stat-success">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.success}</h3>
              <p>DOI Assigned</p>
            </div>
          </Card>

          <Card className="stat-card stat-failed">
            <div className="stat-icon">
              <i className="fas fa-times-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.failed}</h3>
              <p>Failed Deposits</p>
            </div>
          </Card>

          <Card className="stat-card stat-pending">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.pending + statistics.processing}</h3>
              <p>Pending/Processing</p>
            </div>
          </Card>

          <Card className="stat-card stat-not-assigned">
            <div className="stat-icon">
              <i className="fas fa-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{statistics.not_assigned}</h3>
              <p>Not Assigned</p>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="filters-card">
          <div className="filters">
            <div className="filter-group">
              <label>Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
                className="form-select"
              >
                <option value="all">All Statuses</option>
                <option value="not_assigned">Not Assigned</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Manuscripts Table */}
        {manuscripts.length > 0 ? (
          <>
            <Card className="table-card">
              <div className="table-responsive">
                <table className="deposits-table">
                  <thead>
                    <tr>
                      <th>Manuscript ID</th>
                      <th>Title</th>
                      <th>DOI</th>
                      <th>Status</th>
                      <th>Attempts</th>
                      <th>Last Attempt</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manuscripts.map((manuscript) => (
                      <tr key={manuscript._id}>
                        <td>
                          <strong>{manuscript.manuscriptId}</strong>
                        </td>
                        <td>
                          <div className="title-cell">
                            {manuscript.title}
                          </div>
                        </td>
                        <td>
                          {manuscript.doi ? (
                            <div className="doi-cell">
                              <span className="doi-text">{manuscript.doi}</span>
                              <button
                                onClick={() => copyToClipboard(manuscript.doi)}
                                className="btn-icon btn-sm"
                                title="Copy DOI"
                              >
                                <i className="fas fa-copy"></i>
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(manuscript.doiMetadata.depositStatus)}`}>
                            <i className={`fas ${getStatusIcon(manuscript.doiMetadata.depositStatus)}`}></i>
                            {formatStatusText(manuscript.doiMetadata.depositStatus)}
                          </span>
                        </td>
                        <td className="text-center">
                          {manuscript.doiMetadata.depositAttempts}
                        </td>
                        <td>
                          {manuscript.doiMetadata.lastDepositAttempt ? (
                            <span className="date-text">
                              {new Date(manuscript.doiMetadata.lastDepositAttempt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              onClick={() => handleViewDetails(manuscript._id)}
                              className="btn-icon"
                              title="View Details"
                              disabled={actionLoading}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            {(manuscript.doiMetadata.depositStatus === 'failed' || 
                              manuscript.doiMetadata.depositStatus === 'not_assigned') && (
                              <button
                                onClick={() => handleRetry(manuscript._id)}
                                className="btn-icon btn-primary"
                                title="Retry Deposit"
                                disabled={actionLoading}
                              >
                                <i className="fas fa-sync"></i>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedManuscript(manuscript);
                                setShowManualAssignModal(true);
                              }}
                              className="btn-icon btn-secondary"
                              title="Manual Assign"
                              disabled={actionLoading}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            {manuscript.publicUrl && (
                              <a
                                href={manuscript.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-icon btn-success"
                                title="View Public Page"
                              >
                                <i className="fas fa-external-link-alt"></i>
                              </a>
                            )}
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
            <i className="fas fa-inbox empty-icon"></i>
            <h3>No Published Manuscripts</h3>
            <p>No published manuscripts found with the selected filters.</p>
          </Card>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedManuscript && (
          <Modal
            title="DOI Deposit Details"
            onClose={() => setShowDetailsModal(false)}
            size="large"
          >
            <div className="deposit-details">
              <div className="detail-section">
                <h3>Manuscript Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Manuscript ID</label>
                    <span>{selectedManuscript.manuscriptId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Title</label>
                    <span>{selectedManuscript.title}</span>
                  </div>
                  <div className="detail-item">
                    <label>DOI</label>
                    <span>{selectedManuscript.doi || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Public URL</label>
                    {selectedManuscript.publicUrl ? (
                      <a href={selectedManuscript.publicUrl} target="_blank" rel="noopener noreferrer">
                        {selectedManuscript.publicUrl}
                      </a>
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                  <div className="detail-item">
                    <label>Published Date</label>
                    <span>
                      {selectedManuscript.publishedDate
                        ? new Date(selectedManuscript.publishedDate).toLocaleDateString()
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Deposit Status</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Status</label>
                    <span className={`status-badge ${getStatusBadgeClass(selectedManuscript.doiMetadata.depositStatus)}`}>
                      <i className={`fas ${getStatusIcon(selectedManuscript.doiMetadata.depositStatus)}`}></i>
                      {formatStatusText(selectedManuscript.doiMetadata.depositStatus)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Total Attempts</label>
                    <span>{selectedManuscript.doiMetadata.depositAttempts}</span>
                  </div>
                  <div className="detail-item">
                    <label>Last Attempt</label>
                    <span>
                      {selectedManuscript.doiMetadata.lastDepositAttempt
                        ? new Date(selectedManuscript.doiMetadata.lastDepositAttempt).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  {selectedManuscript.doiMetadata.depositError && (
                    <div className="detail-item full-width">
                      <label>Last Error</label>
                      <div className="error-message">
                        {selectedManuscript.doiMetadata.depositError}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedManuscript.doiMetadata.depositHistory && 
               selectedManuscript.doiMetadata.depositHistory.length > 0 && (
                <div className="detail-section">
                  <h3>Deposit History</h3>
                  <div className="history-list">
                    {selectedManuscript.doiMetadata.depositHistory
                      .slice()
                      .reverse()
                      .map((history, index) => (
                        <div key={index} className="history-item">
                          <div className="history-header">
                            <span className="history-attempt">Attempt #{history.attemptNumber}</span>
                            <span className="history-date">
                              {new Date(history.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="history-body">
                            <span className={`status-badge ${getStatusBadgeClass(history.status)}`}>
                              {formatStatusText(history.status)}
                            </span>
                            {history.error && (
                              <div className="history-error">{history.error}</div>
                            )}
                            {history.response && history.response.doi && (
                              <div className="history-doi">DOI: {history.response.doi}</div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Manual Assign Modal */}
        {showManualAssignModal && selectedManuscript && (
          <Modal
            title="Manually Assign DOI"
            onClose={() => {
              setShowManualAssignModal(false);
              setManualDoi('');
            }}
          >
            <div className="manual-assign-form">
              <p className="form-help">
                Manually assign a DOI to <strong>{selectedManuscript.manuscriptId}</strong>
              </p>
              <div className="form-group">
                <label htmlFor="manualDoi">DOI *</label>
                <input
                  type="text"
                  id="manualDoi"
                  value={manualDoi}
                  onChange={(e) => setManualDoi(e.target.value)}
                  placeholder="10.12345/example.2024.001"
                  className="form-control"
                />
                <small className="form-help">
                  Format: 10.xxxxx/suffix (e.g., 10.12345/pujms.2024.001)
                </small>
              </div>
              <div className="modal-actions">
                <button
                  onClick={() => {
                    setShowManualAssignModal(false);
                    setManualDoi('');
                  }}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAssign}
                  className="btn btn-primary"
                  disabled={actionLoading || !manualDoi.trim()}
                >
                  {actionLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Assigning...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i> Assign DOI
                    </>
                  )}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Bulk Retry Confirmation */}
        {showBulkRetryDialog && (
          <ConfirmDialog
            title="Bulk Retry Failed Deposits"
            message={`Are you sure you want to retry all ${statistics.failed} failed DOI deposits? This may take several minutes.`}
            onConfirm={handleBulkRetry}
            onCancel={() => setShowBulkRetryDialog(false)}
            confirmText="Retry All"
            confirmClassName="btn-primary"
          />
        )}
      </div>
    </MainLayout>
  );
};

export default DoiDeposits;
