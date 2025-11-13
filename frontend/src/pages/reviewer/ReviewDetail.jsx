import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout.jsx';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Card from '../../components/common/Card.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import './ReviewDetail.css';

const ReviewDetail = () => {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [review, setReview] = useState(null);
  const [manuscript, setManuscript] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [pdfViewMode, setPdfViewMode] = useState('viewer'); // 'viewer' or 'download'
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    fetchReviewDetails();
  }, [reviewId]);

  const fetchReviewDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch review details
      const reviewResponse = await api.get(`/reviews/${reviewId}`);
      setReview(reviewResponse.data);

      // Fetch manuscript details
      if (reviewResponse.data.manuscript?._id) {
        const manuscriptResponse = await api.get(
          `/manuscripts/${reviewResponse.data.manuscript._id}`
        );
        setManuscript(manuscriptResponse.data);

        // Get manuscript file URL for viewing
        if (manuscriptResponse.data.manuscriptFile?.fileId) {
          const fileUrl = await getFileUrl(manuscriptResponse.data.manuscriptFile.fileId);
          setPdfUrl(fileUrl);
        }
      }
    } catch (err) {
      console.error('Error fetching review details:', err);
      setError(err.response?.data?.message || 'Failed to load review details');
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = async (fileId) => {
    try {
      const response = await api.get(`/manuscripts/file/${fileId}`, {
        responseType: 'blob'
      });
      return URL.createObjectURL(response.data);
    } catch (err) {
      console.error('Error fetching file:', err);
      return null;
    }
  };

  const handleInvitationResponse = async (response) => {
    try {
      await api.post(`/reviews/${reviewId}/respond`, { response });
      fetchReviewDetails(); // Refresh data
      setShowConfirmDialog(false);
    } catch (err) {
      console.error('Error responding to invitation:', err);
      alert(err.response?.data?.message || 'Failed to respond to invitation');
    }
  };

  const handleDownloadManuscript = async () => {
    try {
      if (!manuscript?.manuscriptFile?.fileId) {
        alert('Manuscript file not found');
        return;
      }

      const response = await api.get(
        `/manuscripts/file/${manuscript.manuscriptFile.fileId}`,
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        manuscript.manuscriptFile.filename || 'manuscript.pdf'
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading manuscript:', err);
      alert('Failed to download manuscript');
    }
  };

  const handleDownloadSupplementary = async (fileId, filename) => {
    try {
      const response = await api.get(`/manuscripts/file/${fileId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Failed to download file');
    }
  };

  const openConfirmDialog = (action) => {
    setDialogAction(action);
    setShowConfirmDialog(true);
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

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!review || !manuscript) return <ErrorMessage message="Review not found" />;

  const daysRemaining = review.deadline ? getDaysRemaining(review.deadline) : null;
  const deadlineStatus = daysRemaining !== null ? getDeadlineStatus(daysRemaining) : null;

  return (
    <MainLayout>
      <div className="review-detail">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <button onClick={() => navigate(-1)} className="btn-back">
              <i className="fas fa-arrow-left"></i> Back to Reviews
            </button>
            <h1>Review Assignment</h1>
          </div>
          <div className="header-actions">
            {review.status === 'pending_invitation' && (
              <>
                <button
                  onClick={() => openConfirmDialog('accept')}
                  className="btn btn-success"
                >
                  <i className="fas fa-check"></i> Accept Invitation
                </button>
                <button
                  onClick={() => openConfirmDialog('decline')}
                  className="btn btn-danger"
                >
                  <i className="fas fa-times"></i> Decline
                </button>
              </>
            )}
            {review.status === 'in_progress' && !review.submittedAt && (
              <Link
                to={`/reviewer/review/${reviewId}/submit`}
                className="btn btn-primary"
              >
                <i className="fas fa-edit"></i> Submit Review
              </Link>
            )}
          </div>
        </div>

        {/* Status Banner */}
        <Card className="status-banner">
          <div className="status-info">
            <StatusBadge status={review.status} />
            {deadlineStatus && review.status === 'in_progress' && (
              <span className={`deadline-indicator ${deadlineStatus.className}`}>
                <i className="fas fa-clock"></i> {deadlineStatus.text}
              </span>
            )}
          </div>
          {review.deadline && (
            <div className="deadline-details">
              <strong>Review Deadline:</strong>{' '}
              {new Date(review.deadline).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          )}
        </Card>

        <div className="detail-grid">
          {/* Left Column - Manuscript Details */}
          <div className="left-column">
            {/* Manuscript Information */}
            <Card>
              <div className="card-header">
                <h2>
                  <i className="fas fa-file-alt"></i> Manuscript Information
                </h2>
              </div>
              <div className="card-body">
                <div className="info-group">
                  <label>Title:</label>
                  <p className="manuscript-title">{manuscript.title}</p>
                </div>

                <div className="info-group">
                  <label>Manuscript ID:</label>
                  <p className="manuscript-id">{manuscript.manuscriptId}</p>
                </div>

                <div className="info-group">
                  <label>Submission Date:</label>
                  <p>{new Date(manuscript.submittedAt).toLocaleDateString()}</p>
                </div>

                <div className="info-group">
                  <label>Keywords:</label>
                  <div className="keywords-list">
                    {manuscript.keywords && manuscript.keywords.length > 0 ? (
                      manuscript.keywords.map((keyword, index) => (
                        <span key={index} className="keyword-tag">
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <p className="no-data">No keywords provided</p>
                    )}
                  </div>
                </div>

                <div className="info-group">
                  <label>Abstract:</label>
                  <p className="abstract-text">{manuscript.abstract}</p>
                </div>

                {/* Authors - Anonymized for Double-Blind */}
                <div className="info-group">
                  <label>Authors:</label>
                  <div className="authors-info">
                    <i className="fas fa-user-secret"></i>
                    <em>Author information is hidden for blind review</em>
                  </div>
                </div>
              </div>
            </Card>

            {/* Review Guidelines */}
            <Card>
              <div className="card-header">
                <h2>
                  <i className="fas fa-list-check"></i> Review Guidelines
                </h2>
              </div>
              <div className="card-body guidelines">
                <h3>Evaluation Criteria:</h3>
                <ul>
                  <li>
                    <strong>Originality:</strong> Is the research novel and does it contribute
                    new knowledge to the field?
                  </li>
                  <li>
                    <strong>Methodology:</strong> Are the research methods sound and appropriate?
                  </li>
                  <li>
                    <strong>Clarity:</strong> Is the manuscript well-written, organized, and
                    easy to understand?
                  </li>
                  <li>
                    <strong>Significance:</strong> Is the research important and relevant to the
                    journal's scope?
                  </li>
                </ul>

                <h3>Review Process:</h3>
                <ol>
                  <li>Download and read the manuscript thoroughly</li>
                  <li>Evaluate the work based on the criteria above</li>
                  <li>Provide constructive feedback for authors</li>
                  <li>Provide confidential comments for the editor</li>
                  <li>Make your recommendation (Accept/Revise/Reject)</li>
                </ol>

                <div className="guideline-note">
                  <i className="fas fa-info-circle"></i>
                  <p>
                    Please maintain the confidentiality of this manuscript. Do not share or
                    discuss it with anyone outside the review process.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Manuscript Files */}
          <div className="right-column">
            {/* Manuscript File Viewer/Download */}
            <Card>
              <div className="card-header">
                <h2>
                  <i className="fas fa-file-pdf"></i> Manuscript File
                </h2>
                <div className="view-mode-toggle">
                  <button
                    onClick={() => setPdfViewMode('viewer')}
                    className={`toggle-btn ${pdfViewMode === 'viewer' ? 'active' : ''}`}
                  >
                    <i className="fas fa-eye"></i> View
                  </button>
                  <button
                    onClick={handleDownloadManuscript}
                    className="toggle-btn"
                  >
                    <i className="fas fa-download"></i> Download
                  </button>
                </div>
              </div>
              <div className="card-body pdf-viewer-container">
                {pdfViewMode === 'viewer' && pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    title="Manuscript Viewer"
                    className="pdf-iframe"
                  />
                ) : (
                  <div className="download-prompt">
                    <i className="fas fa-file-pdf"></i>
                    <h3>{manuscript.manuscriptFile?.filename || 'Manuscript File'}</h3>
                    <p>
                      Size: {(manuscript.manuscriptFile?.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={handleDownloadManuscript}
                      className="btn btn-primary btn-lg"
                    >
                      <i className="fas fa-download"></i> Download Manuscript
                    </button>
                  </div>
                )}
              </div>
            </Card>

            {/* Supplementary Files */}
            {manuscript.supplementaryFiles && manuscript.supplementaryFiles.length > 0 && (
              <Card>
                <div className="card-header">
                  <h2>
                    <i className="fas fa-paperclip"></i> Supplementary Files
                  </h2>
                </div>
                <div className="card-body">
                  <div className="supplementary-files-list">
                    {manuscript.supplementaryFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <div className="file-info">
                          <i className="fas fa-file"></i>
                          <div>
                            <p className="file-name">{file.filename}</p>
                            <p className="file-size">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadSupplementary(file.fileId, file.filename)}
                          className="btn btn-outline btn-sm"
                        >
                          <i className="fas fa-download"></i> Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Review Timeline */}
            <Card>
              <div className="card-header">
                <h2>
                  <i className="fas fa-timeline"></i> Review Timeline
                </h2>
              </div>
              <div className="card-body">
                <div className="timeline">
                  <div className="timeline-item completed">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h4>Review Assigned</h4>
                      <p>{new Date(review.assignedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {review.acceptedAt && (
                    <div className="timeline-item completed">
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <h4>Invitation Accepted</h4>
                        <p>{new Date(review.acceptedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}

                  {review.submittedAt && (
                    <div className="timeline-item completed">
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <h4>Review Submitted</h4>
                        <p>{new Date(review.submittedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}

                  {!review.submittedAt && review.deadline && (
                    <div className="timeline-item pending">
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <h4>Review Due</h4>
                        <p>{new Date(review.deadline).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Confirm Dialog */}
        {showConfirmDialog && (
          <ConfirmDialog
            title={dialogAction === 'accept' ? 'Accept Review Invitation' : 'Decline Review Invitation'}
            message={
              dialogAction === 'accept'
                ? 'Are you sure you want to accept this review invitation? You will be responsible for completing the review by the deadline.'
                : 'Are you sure you want to decline this review invitation? This action cannot be undone.'
            }
            confirmText={dialogAction === 'accept' ? 'Accept' : 'Decline'}
            confirmVariant={dialogAction === 'accept' ? 'success' : 'danger'}
            onConfirm={() => handleInvitationResponse(dialogAction === 'accept' ? 'accepted' : 'declined')}
            onCancel={() => setShowConfirmDialog(false)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default ReviewDetail;