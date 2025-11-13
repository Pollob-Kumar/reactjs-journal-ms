import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FaArrowLeft, FaDownload, FaEdit, FaTrash, FaClock, FaUser } from 'react-icons/fa';
import manuscriptService from '../../services/manuscriptService';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { toast } from 'react-toastify';
import './ManuscriptDetail.css';

const ManuscriptDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data, isLoading, error } = useQuery(
    ['manuscript', id],
    () => manuscriptService.getManuscript(id)
  );

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await manuscriptService.downloadFile(fileId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async () => {
    try {
      await manuscriptService.deleteManuscript(id);
      toast.success('Manuscript deleted successfully');
      navigate('/author/submissions');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete manuscript');
    }
  };

  if (isLoading) {
    return <Loading message="Loading manuscript details..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load manuscript details" />;
  }

  const manuscript = data?.data;

  return (
    <div className="manuscript-detail">
      <div className="page-header">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        <div className="header-actions">
          {manuscript.status === 'Revisions Required' && (
            <Link
              to={`/author/manuscript/${id}/revise`}
              className="btn btn-warning"
            >
              <FaEdit /> Submit Revision
            </Link>
          )}
          {manuscript.status !== 'Published' && (
            <button
              className="btn btn-danger"
              onClick={() => setShowDeleteDialog(true)}
            >
              <FaTrash /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <Card title="Manuscript Information">
        <div className="info-grid">
          <div className="info-item">
            <label>Manuscript ID</label>
            <strong>{manuscript.manuscriptId}</strong>
          </div>
          <div className="info-item">
            <label>Status</label>
            <StatusBadge status={manuscript.status} />
          </div>
          <div className="info-item">
            <label>Submission Date</label>
            <span>{new Date(manuscript.submissionDate).toLocaleDateString()}</span>
          </div>
          <div className="info-item">
            <label>Last Updated</label>
            <span>{new Date(manuscript.lastUpdated).toLocaleDateString()}</span>
          </div>
          {manuscript.assignedEditor && (
            <div className="info-item">
              <label>Assigned Editor</label>
              <span>{manuscript.assignedEditor.fullName}</span>
            </div>
          )}
          {manuscript.doi && (
            <div className="info-item">
              <label>DOI</label>
              <a href={`https://doi.org/${manuscript.doi}`} target="_blank" rel="noopener noreferrer">
                {manuscript.doi}
              </a>
            </div>
          )}
            {manuscript.publicUrl && (
  <div className="info-item">
    <label>Public URL</label>
    <a 
      href={manuscript.publicUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="public-url-link"
    >
      {manuscript.publicUrl}
      <i className="fas fa-external-link-alt" style={{ marginLeft: '0.5rem' }}></i>
    </a>
  </div>
)}

{manuscript.status === 'Published' && (
  <div className="published-notice">
    <i className="fas fa-check-circle"></i>
    <span>This manuscript has been published and is publicly accessible</span>
  </div>
)}

        </div>
      </Card>

      {/* Title and Abstract */}
      <Card title="Title and Abstract">
        <div className="content-section">
          <h3 className="manuscript-detail-title">{manuscript.title}</h3>
          
          {manuscript.keywords && manuscript.keywords.length > 0 && (
            <div className="keywords-section">
              <strong>Keywords:</strong>
              <div className="keywords-list">
                {manuscript.keywords.map((keyword, index) => (
                  <span key={index} className="keyword-tag">{keyword}</span>
                ))}
              </div>
            </div>
          )}

          <div className="abstract-section">
            <h4>Abstract</h4>
            <p className="abstract-text">{manuscript.abstract}</p>
          </div>
        </div>
      </Card>

      {/* Authors */}
      <Card title="Authors">
        <div className="authors-list">
          {manuscript.authors.map((author, index) => (
            <div key={index} className="author-card">
              <div className="author-info">
                <FaUser className="author-icon" />
                <div>
                  <strong>{author.firstName} {author.lastName}</strong>
                  {author.isCorresponding && (
                    <span className="badge badge-primary ml-2">Corresponding</span>
                  )}
                  <p className="author-details">
                    {author.affiliation}
                    {author.orcid && ` • ORCID: ${author.orcid}`}
                  </p>
                  <p className="author-email">{author.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Files */}
      <Card title="Manuscript Files">
        <div className="files-list">
          {manuscript.files.map((file, index) => (
            <div key={index} className="file-item">
              <div className="file-info">
                <strong>{file.originalName}</strong>
                <span className="file-type">{file.fileType}</span>
              </div>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => handleDownload(file.fileId, file.originalName)}
              >
                <FaDownload /> Download
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Revisions */}
      {manuscript.revisions && manuscript.revisions.length > 0 && (
        <Card title="Revision History">
          <div className="revisions-list">
            {manuscript.revisions.map((revision, index) => (
              <div key={index} className="revision-item">
                <div className="revision-header">
                  <h4>Version {revision.version}</h4>
                  <span className="revision-date">
                    {new Date(revision.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="revision-files">
                  {revision.files.map((file, fileIndex) => (
                    <div key={fileIndex} className="file-item">
                      <span>{file.originalName}</span>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleDownload(file.fileId, file.originalName)}
                      >
                        <FaDownload /> Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Editorial Decision */}
      {manuscript.editorDecision && (
        <Card title="Editorial Decision">
          <div className="decision-card">
            <div className="decision-header">
              <StatusBadge status={manuscript.editorDecision.decision} />
              <span className="decision-date">
                {new Date(manuscript.editorDecision.decidedAt).toLocaleDateString()}
              </span>
            </div>
            {manuscript.editorDecision.comments && (
              <div className="decision-comments">
                <h4>Editor's Comments:</h4>
                <p>{manuscript.editorDecision.comments}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Timeline */}
      {manuscript.timeline && manuscript.timeline.length > 0 && (
        <Card title="Submission Timeline">
          <div className="timeline">
            {manuscript.timeline.map((event, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-marker">
                  <FaClock />
                </div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <strong>{event.event}</strong>
                    <span className="timeline-date">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {event.details && (
                    <p className="timeline-details">{event.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Manuscript"
        message="Are you sure you want to delete this manuscript? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default ManuscriptDetail;
