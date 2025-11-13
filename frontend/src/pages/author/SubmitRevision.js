import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import manuscriptService from '../../services/manuscriptService';
import Card from '../../components/common/Card';
import FileUpload from '../../components/common/FileUpload';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import { FaPaperPlane, FaArrowLeft } from 'react-icons/fa';
import './SubmitRevision.css';

const SubmitRevision = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [revisedFiles, setRevisedFiles] = useState([]);
  const [responseFile, setResponseFile] = useState([]);

  // Fetch manuscript details
  const { data, isLoading, error } = useQuery(
    ['manuscript', id],
    () => manuscriptService.getManuscript(id)
  );

  const formik = useFormik({
    initialValues: {
      revisionNotes: ''
    },
    validationSchema: Yup.object({
      revisionNotes: Yup.string()
        .max(2000, 'Revision notes must be 2000 characters or less')
    }),
    onSubmit: async (values) => {
      // Validation
      if (revisedFiles.length === 0) {
        toast.error('Please upload at least one revised manuscript file');
        return;
      }

      if (responseFile.length === 0) {
        toast.error('Please upload your response to reviewers document');
        return;
      }

      setLoading(true);

      try {
        // Create FormData
        const formData = new FormData();
        
        // Append revised manuscript files
        revisedFiles.forEach((file) => {
          formData.append('files', file);
        });

        // Append response to reviewers file
        formData.append('files', responseFile[0]);
        
        // Append metadata
        if (values.revisionNotes) {
          formData.append('revisionNotes', values.revisionNotes);
        }

        await manuscriptService.submitRevision(id, formData);
        toast.success('Revision submitted successfully!');
        navigate(`/author/manuscript/${id}`);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to submit revision');
      } finally {
        setLoading(false);
      }
    }
  });

  if (isLoading) {
    return <Loading message="Loading manuscript details..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load manuscript details" />;
  }

  const manuscript = data?.data;

  // Check if revision is allowed
  if (manuscript.status !== 'Revisions Required') {
    return (
      <div className="submit-revision">
        <Card>
          <div className="alert alert-warning">
            <h3>Revision Not Required</h3>
            <p>This manuscript is not currently in "Revisions Required" status.</p>
            <button
              className="btn btn-primary mt-3"
              onClick={() => navigate(`/author/manuscript/${id}`)}
            >
              Back to Manuscript Details
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="submit-revision">
      <div className="page-header">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        <div>
          <h1>Submit Revision</h1>
          <p className="manuscript-id">Manuscript ID: {manuscript.manuscriptId}</p>
        </div>
      </div>

      {/* Original Manuscript Info */}
      <Card title="Original Manuscript">
        <div className="manuscript-info">
          <h3>{manuscript.title}</h3>
          <p className="info-text">
            <strong>Current Version:</strong> {manuscript.currentVersion}
          </p>
          <p className="info-text">
            <strong>Submission Date:</strong>{' '}
            {new Date(manuscript.submissionDate).toLocaleDateString()}
          </p>
        </div>
      </Card>

      {/* Editor's Decision and Comments */}
      {manuscript.editorDecision && (
        <Card title="Editorial Decision & Reviewer Comments">
          <div className="decision-info">
            <div className="decision-badge">
              <strong>Decision:</strong>
              <span className="badge badge-warning">
                {manuscript.editorDecision.decision}
              </span>
            </div>
            
            {manuscript.editorDecision.comments && (
              <div className="editor-comments">
                <h4>Editor's Comments:</h4>
                <div className="comments-box">
                  {manuscript.editorDecision.comments}
                </div>
              </div>
            )}

            <div className="alert alert-info mt-3">
              <strong>Important:</strong> Please address all reviewer comments in your 
              revised manuscript and provide a detailed response document explaining 
              the changes you have made.
            </div>
          </div>
        </Card>
      )}

      {/* Revision Form */}
      <form onSubmit={formik.handleSubmit}>
        {/* Upload Revised Manuscript */}
        <Card title="Upload Revised Manuscript Files">
          <FileUpload
            files={revisedFiles}
            onFilesChange={setRevisedFiles}
            accept=".pdf,.doc,.docx"
            multiple={true}
            label="Revised Manuscript Files *"
          />
          <div className="form-help">
            <p>
              Please upload your revised manuscript and any supplementary files. 
              Ensure all changes are highlighted or tracked if requested by the editor.
            </p>
          </div>
        </Card>

        {/* Upload Response to Reviewers */}
        <Card title="Response to Reviewers">
          <FileUpload
            files={responseFile}
            onFilesChange={setResponseFile}
            accept=".pdf,.doc,.docx"
            multiple={false}
            label="Response to Reviewers Document *"
          />
          <div className="form-help">
            <p>
              Upload a document that addresses each reviewer comment point-by-point. 
              Clearly indicate what changes have been made in response to each comment.
            </p>
          </div>
        </Card>

        {/* Revision Notes */}
        <Card title="Additional Notes (Optional)">
          <div className="form-group">
            <label htmlFor="revisionNotes" className="form-label">
              Revision Summary
            </label>
            <textarea
              id="revisionNotes"
              name="revisionNotes"
              rows="6"
              className={`form-control ${
                formik.touched.revisionNotes && formik.errors.revisionNotes ? 'error' : ''
              }`}
              placeholder="Provide a brief summary of the major changes made in this revision..."
              {...formik.getFieldProps('revisionNotes')}
            />
            {formik.touched.revisionNotes && formik.errors.revisionNotes && (
              <div className="form-error">{formik.errors.revisionNotes}</div>
            )}
            <small className="form-help">
              Characters: {formik.values.revisionNotes.length}/2000
            </small>
          </div>
        </Card>

        {/* Revision Checklist */}
        <Card title="Revision Checklist">
          <div className="checklist">
            <div className="checklist-item">
              <input type="checkbox" id="check1" required />
              <label htmlFor="check1">
                I have addressed all reviewer comments in my revised manuscript.
              </label>
            </div>
            <div className="checklist-item">
              <input type="checkbox" id="check2" required />
              <label htmlFor="check2">
                I have uploaded a detailed point-by-point response to reviewers.
              </label>
            </div>
            <div className="checklist-item">
              <input type="checkbox" id="check3" required />
              <label htmlFor="check3">
                I have reviewed the revised manuscript for any formatting or grammatical errors.
              </label>
            </div>
            <div className="checklist-item">
              <input type="checkbox" id="check4" required />
              <label htmlFor="check4">
                All co-authors have approved this revised version for resubmission.
              </label>
            </div>
          </div>
        </Card>

        {/* Submit Buttons */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/author/manuscript/${id}`)}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div> Submitting Revision...
              </>
            ) : (
              <>
                <FaPaperPlane /> Submit Revision
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitRevision;