// frontend/src/components/common/pages/admin/RevisionHistory.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import Card from '../../components/common/Card';
import './RevisionHistory.css';

const RevisionHistory = () => {
  const { manuscriptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manuscript, setManuscript] = useState(null);
  const [revisionHistory, setRevisionHistory] = useState([]);
  const [selectedRevisions, setSelectedRevisions] = useState([null, null]);
  const [comparison, setComparison] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    fetchRevisionHistory();
  }, [manuscriptId]);

  const fetchRevisionHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/admin/manuscripts/${manuscriptId}/revisions`);
      setManuscript({
        manuscriptId: response.data.data.manuscriptId,
        title: response.data.data.title,
        currentVersion: response.data.data.currentVersion
      });
      setRevisionHistory(response.data.data.revisionHistory);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching revision history:', err);
      setError(err.response?.data?.message || 'Failed to load revision history');
      setLoading(false);
    }
  };

  const handleRevisionSelect = (version, position) => {
    const newSelection = [...selectedRevisions];
    newSelection[position] = version;
    setSelectedRevisions(newSelection);
  };

  const handleCompare = async () => {
    if (!selectedRevisions[0] || !selectedRevisions[1]) {
      alert('Please select two revisions to compare');
      return;
    }

    if (selectedRevisions[0] === selectedRevisions[1]) {
      alert('Please select different revisions to compare');
      return;
    }

    try {
      const [v1, v2] = selectedRevisions.sort((a, b) => a - b);
      const response = await api.get(
        `/admin/manuscripts/${manuscriptId}/revisions/compare/${v1}/${v2}`
      );
      setComparison(response.data.data);
      setShowComparison(true);
    } catch (err) {
      console.error('Error comparing revisions:', err);
      alert(err.response?.data?.message || 'Failed to compare revisions');
    }
  };

  const downloadFile = async (fileId, fileName) => {
    try {
      const response = await api.get(`/files/${fileId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Failed to download file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <MainLayout>
      <div className="revision-history">
        {/* Header */}
        <div className="page-header">
          <div>
            <button onClick={() => navigate(-1)} className="btn-back">
              <i className="fas fa-arrow-left"></i> Back
            </button>
            <h1>Revision History</h1>
            <p className="manuscript-info">
              <strong>{manuscript.manuscriptId}</strong> - {manuscript.title}
            </p>
            <p className="current-version">
              Current Version: <span className="version-badge">v{manuscript.currentVersion}</span>
            </p>
          </div>
        </div>

        {/* Comparison Tool */}
        <Card className="comparison-tool">
          <h2>
            <i className="fas fa-code-compare"></i> Compare Revisions
          </h2>
          <div className="comparison-selectors">
            <div className="selector-group">
              <label>Version 1</label>
              <select
                value={selectedRevisions[0] || ''}
                onChange={(e) => handleRevisionSelect(parseInt(e.target.value), 0)}
                className="form-select"
              >
                <option value="">Select version...</option>
                {revisionHistory.map((rev) => (
                  <option key={rev.version} value={rev.version}>
                    Version {rev.version} {rev.isInitial ? '(Initial)' : '(Revision)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="selector-divider">
              <i className="fas fa-arrows-left-right"></i>
            </div>

            <div className="selector-group">
              <label>Version 2</label>
              <select
                value={selectedRevisions[1] || ''}
                onChange={(e) => handleRevisionSelect(parseInt(e.target.value), 1)}
                className="form-select"
              >
                <option value="">Select version...</option>
                {revisionHistory.map((rev) => (
                  <option key={rev.version} value={rev.version}>
                    Version {rev.version} {rev.isInitial ? '(Initial)' : '(Revision)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleCompare}
            className="btn btn-primary"
            disabled={!selectedRevisions[0] || !selectedRevisions[1]}
          >
            <i className="fas fa-code-compare"></i> Compare Versions
          </button>
        </Card>

        {/* Comparison Results */}
        {showComparison && comparison && (
          <Card className="comparison-results">
            <div className="comparison-header">
              <h2>
                <i className="fas fa-file-contract"></i> Comparison Results
              </h2>
              <button
                onClick={() => setShowComparison(false)}
                className="btn btn-outline btn-sm"
              >
                <i className="fas fa-times"></i> Close
              </button>
            </div>

            <div className="comparison-summary">
              <div className="summary-item added">
                <div className="summary-icon">
                  <i className="fas fa-plus-circle"></i>
                </div>
                <div className="summary-content">
                  <h4>{comparison.comparison.changes.summary.added}</h4>
                  <p>Files Added</p>
                </div>
              </div>

              <div className="summary-item modified">
                <div className="summary-icon">
                  <i className="fas fa-edit"></i>
                </div>
                <div className="summary-content">
                  <h4>{comparison.comparison.changes.summary.modified}</h4>
                  <p>Files Modified</p>
                </div>
              </div>

              <div className="summary-item removed">
                <div className="summary-icon">
                  <i className="fas fa-minus-circle"></i>
                </div>
                <div className="summary-content">
                  <h4>{comparison.comparison.changes.summary.removed}</h4>
                  <p>Files Removed</p>
                </div>
              </div>
            </div>

            {/* Files Added */}
            {comparison.comparison.changes.filesAdded.length > 0 && (
              <div className="change-section added-files">
                <h3>
                  <i className="fas fa-plus-circle"></i> Files Added
                </h3>
                <div className="file-list">
                  {comparison.comparison.changes.filesAdded.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <i className="fas fa-file"></i>
                        <span className="file-name">{file.originalName}</span>
                        <span className="file-size">{formatFileSize(file.size)}</span>
                      </div>
                      <button
                        onClick={() => downloadFile(file.fileId, file.originalName)}
                        className="btn btn-sm btn-outline"
                      >
                        <i className="fas fa-download"></i> Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files Modified */}
            {comparison.comparison.changes.filesModified.length > 0 && (
              <div className="change-section modified-files">
                <h3>
                  <i className="fas fa-edit"></i> Files Modified
                </h3>
                <div className="file-list">
                  {comparison.comparison.changes.filesModified.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <i className="fas fa-file-edit"></i>
                        <span className="file-name">{file.originalName}</span>
                        <span className="file-size">{formatFileSize(file.size)}</span>
                      </div>
                      <button
                        onClick={() => downloadFile(file.fileId, file.originalName)}
                        className="btn btn-sm btn-outline"
                      >
                        <i className="fas fa-download"></i> Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files Removed */}
            {comparison.comparison.changes.filesRemoved.length > 0 && (
              <div className="change-section removed-files">
                <h3>
                  <i className="fas fa-minus-circle"></i> Files Removed
                </h3>
                <div className="file-list">
                  {comparison.comparison.changes.filesRemoved.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-info">
                        <i className="fas fa-file"></i>
                        <span className="file-name">{file.originalName}</span>
                        <span className="file-size">{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Revision Timeline */}
        <Card className="revision-timeline">
          <h2>
            <i className="fas fa-history"></i> Revision Timeline
          </h2>

          <div className="timeline">
            {revisionHistory.map((revision, index) => (
              <div key={revision.version} className="timeline-item">
                <div className="timeline-marker">
                  <div className={`marker-dot ${revision.isInitial ? 'initial' : 'revision'}`}>
                    {revision.version}
                  </div>
                  {index < revisionHistory.length - 1 && <div className="marker-line"></div>}
                </div>

                <div className="timeline-content">
                  <div className="revision-card">
                    <div className="revision-header">
                      <h3>
                        {revision.isInitial ? 'Initial Submission' : `Revision ${revision.version}`}
                      </h3>
                      <span className="revision-date">
                        {new Date(revision.submittedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="revision-meta">
                      <div className="meta-item">
                        <i className="fas fa-user"></i>
                        <span>
                          Submitted by: {revision.submittedBy.firstName} {revision.submittedBy.lastName}
                        </span>
                      </div>
                      <div className="meta-item">
                        <i className="fas fa-envelope"></i>
                        <span>{revision.submittedBy.email}</span>
                      </div>
                      <div className="meta-item">
                        <i className="fas fa-file"></i>
                        <span>{revision.files.length} file(s)</span>
                      </div>
                    </div>

                    {/* Files */}
                    <div className="revision-files">
                      <h4>Files</h4>
                      <div className="file-list">
                        {revision.files.map((file, fileIndex) => (
                          <div key={fileIndex} className="file-item">
                            <div className="file-info">
                              <i className="fas fa-file-pdf"></i>
                              <div className="file-details">
                                <span className="file-name">{file.originalName}</span>
                                <span className="file-meta">
                                  {formatFileSize(file.size)} • {file.fileType}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => downloadFile(file.fileId, file.originalName)}
                              className="btn btn-sm btn-outline"
                            >
                              <i className="fas fa-download"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Response to Reviewers */}
                    {revision.responseToReviewers && (
                      <div className="response-section">
                        <h4>
                          <i className="fas fa-reply"></i> Response to Reviewers
                        </h4>
                        <button
                          onClick={() => downloadFile(revision.responseToReviewers, 'response-to-reviewers.pdf')}
                          className="btn btn-sm btn-primary"
                        >
                          <i className="fas fa-download"></i> Download Response
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default RevisionHistory;
