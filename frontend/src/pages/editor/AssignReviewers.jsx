import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout.jsx';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import './AssignReviewers.css';

const AssignReviewers = () => {
  const { manuscriptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manuscript, setManuscript] = useState(null);
  const [availableReviewers, setAvailableReviewers] = useState([]);
  const [existingReviews, setExistingReviews] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAssignments, setPendingAssignments] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [manuscriptId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch manuscript details
      const manuscriptResponse = await api.get(`/manuscripts/${manuscriptId}`);
      setManuscript(manuscriptResponse.data);

      // Fetch available reviewers (users with Reviewer role)
      const reviewersResponse = await api.get('/users?role=reviewer');
      setAvailableReviewers(reviewersResponse.data);

      // Fetch existing reviews for this manuscript
      const reviewsResponse = await api.get(`/reviews/manuscript/${manuscriptId}`);
      setExistingReviews(reviewsResponse.data || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const validationSchema = Yup.object({
    reviewers: Yup.array()
      .of(
        Yup.object({
          reviewerId: Yup.string().required('Reviewer is required'),
          deadline: Yup.date()
            .min(new Date(), 'Deadline must be in the future')
            .required('Deadline is required')
        })
      )
      .min(1, 'At least one reviewer must be assigned')
      .test('unique-reviewers', 'Cannot assign the same reviewer twice', function(reviewers) {
        if (!reviewers) return true;
        const reviewerIds = reviewers.map(r => r.reviewerId);
        return reviewerIds.length === new Set(reviewerIds).size;
      })
  });

  const getDefaultDeadline = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14); // 14 days from now
    return date.toISOString().split('T')[0];
  };

  const initialValues = {
    reviewers: [
      {
        reviewerId: '',
        deadline: getDefaultDeadline()
      }
    ]
  };

  const handleSubmit = (values) => {
    setPendingAssignments(values);
    setShowConfirmDialog(true);
  };

  const confirmAssignment = async () => {
    try {
      const assignmentPromises = pendingAssignments.reviewers.map(reviewer =>
        api.post('/reviews', {
          manuscriptId: manuscriptId,
          reviewerId: reviewer.reviewerId,
          deadline: reviewer.deadline
        })
      );

      await Promise.all(assignmentPromises);

      alert('Reviewers assigned successfully!');
      navigate(`/editor/submission/${manuscriptId}`);
    } catch (err) {
      console.error('Error assigning reviewers:', err);
      alert(err.response?.data?.message || 'Failed to assign reviewers');
      setShowConfirmDialog(false);
    }
  };

  const isReviewerAlreadyAssigned = (reviewerId) => {
    return existingReviews.some(review => review.reviewer?._id === reviewerId);
  };

  const getFilteredReviewers = () => {
    return availableReviewers.filter(reviewer => {
      const fullName = `${reviewer.firstName} ${reviewer.lastName}`.toLowerCase();
      const email = reviewer.email.toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return fullName.includes(search) || email.includes(search);
    });
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!manuscript) return <ErrorMessage message="Manuscript not found" />;

  return (
    <MainLayout>
      <div className="assign-reviewers">
        {/* Header */}
        <div className="page-header">
          <div>
            <button onClick={() => navigate(-1)} className="btn-back">
              <i className="fas fa-arrow-left"></i> Back to Submission
            </button>
            <h1>Assign Reviewers</h1>
            <p className="manuscript-title">{manuscript.title}</p>
          </div>
        </div>

        <div className="content-grid">
          {/* Left Column - Assignment Form */}
          <div className="left-column">
            <Card>
              <div className="card-header">
                <h2>
                  <i className="fas fa-user-plus"></i> Select Reviewers
                </h2>
              </div>
              <div className="card-body">
                <Formik
                  initialValues={initialValues}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ values, errors, touched, setFieldValue }) => (
                    <Form>
                      <FieldArray name="reviewers">
                        {({ push, remove }) => (
                          <>
                            {/* Search Reviewers */}
                            <div className="search-section">
                              <div className="search-input-group">
                                <i className="fas fa-search"></i>
                                <input
                                  type="text"
                                  placeholder="Search reviewers by name or email..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Reviewer Assignments */}
                            {values.reviewers.map((reviewer, index) => (
                              <div key={index} className="reviewer-assignment">
                                <div className="assignment-header">
                                  <h3>Reviewer {index + 1}</h3>
                                  {values.reviewers.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => remove(index)}
                                      className="btn btn-danger btn-sm"
                                    >
                                      <i className="fas fa-trash"></i> Remove
                                    </button>
                                  )}
                                </div>

                                {/* Reviewer Selection */}
                                <div className="form-group">
                                  <label htmlFor={`reviewers.${index}.reviewerId`}>
                                    Select Reviewer *
                                  </label>
                                  <select
                                    id={`reviewers.${index}.reviewerId`}
                                    value={reviewer.reviewerId}
                                    onChange={(e) => setFieldValue(`reviewers.${index}.reviewerId`, e.target.value)}
                                    className={`form-select ${
                                      errors.reviewers?.[index]?.reviewerId && 
                                      touched.reviewers?.[index]?.reviewerId
                                        ? 'error'
                                        : ''
                                    }`}
                                  >
                                    <option value="">-- Select a Reviewer --</option>
                                    {getFilteredReviewers().map((rev) => (
                                      <option
                                        key={rev._id}
                                        value={rev._id}
                                        disabled={isReviewerAlreadyAssigned(rev._id)}
                                      >
                                        {rev.firstName} {rev.lastName} ({rev.email})
                                        {rev.affiliation && ` - ${rev.affiliation}`}
                                        {isReviewerAlreadyAssigned(rev._id) && ' - Already Assigned'}
                                      </option>
                                    ))}
                                  </select>
                                  {errors.reviewers?.[index]?.reviewerId && 
                                   touched.reviewers?.[index]?.reviewerId && (
                                    <div className="error-message">
                                      {errors.reviewers[index].reviewerId}
                                    </div>
                                  )}
                                </div>

                                {/* Deadline */}
                                <div className="form-group">
                                  <label htmlFor={`reviewers.${index}.deadline`}>
                                    Review Deadline *
                                  </label>
                                  <input
                                    type="date"
                                    id={`reviewers.${index}.deadline`}
                                    value={reviewer.deadline}
                                    onChange={(e) => setFieldValue(`reviewers.${index}.deadline`, e.target.value)}
                                    className={`form-input ${
                                      errors.reviewers?.[index]?.deadline && 
                                      touched.reviewers?.[index]?.deadline
                                        ? 'error'
                                        : ''
                                    }`}
                                    min={new Date().toISOString().split('T')[0]}
                                  />
                                  {errors.reviewers?.[index]?.deadline && 
                                   touched.reviewers?.[index]?.deadline && (
                                    <div className="error-message">
                                      {errors.reviewers[index].deadline}
                                    </div>
                                  )}
                                </div>

                                {/* Display selected reviewer info */}
                                {reviewer.reviewerId && (
                                  <div className="selected-reviewer-info">
                                    {(() => {
                                      const selected = availableReviewers.find(
                                        r => r._id === reviewer.reviewerId
                                      );
                                      return selected ? (
                                        <div className="reviewer-card">
                                          <div className="reviewer-avatar">
                                            <i className="fas fa-user-tie"></i>
                                          </div>
                                          <div className="reviewer-details">
                                            <h4>{selected.firstName} {selected.lastName}</h4>
                                            <p><i className="fas fa-envelope"></i> {selected.email}</p>
                                            {selected.affiliation && (
                                              <p><i className="fas fa-building"></i> {selected.affiliation}</p>
                                            )}
                                          </div>
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Add Another Reviewer Button */}
                            <button
                              type="button"
                              onClick={() => push({ reviewerId: '', deadline: getDefaultDeadline() })}
                              className="btn btn-outline btn-block"
                            >
                              <i className="fas fa-plus"></i> Add Another Reviewer
                            </button>

                            {/* Form-level errors */}
                            {typeof errors.reviewers === 'string' && (
                              <div className="error-message">{errors.reviewers}</div>
                            )}

                            {/* Submit Button */}
                            <div className="form-actions">
                              <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="btn btn-outline"
                              >
                                <i className="fas fa-times"></i> Cancel
                              </button>
                              <button type="submit" className="btn btn-primary btn-lg">
                                <i className="fas fa-paper-plane"></i> Send Invitations
                              </button>
                            </div>
                          </>
                        )}
                      </FieldArray>
                    </Form>
                  )}
                </Formik>
              </div>
            </Card>
          </div>

          {/* Right Column - Info & Existing Reviews */}
          <div className="right-column">
            {/* Manuscript Info */}
            <Card>
              <div className="card-header">
                <h2>
                  <i className="fas fa-file-alt"></i> Manuscript Information
                </h2>
              </div>
              <div className="card-body">
                <div className="info-item">
                  <label>Manuscript ID:</label>
                  <span className="manuscript-id-badge">{manuscript.manuscriptId}</span>
                </div>
                <div className="info-item">
                  <label>Submitted:</label>
                  <span>{new Date(manuscript.submittedAt).toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <label>Author:</label>
                  <span>
                    {manuscript.authors?.[0]?.firstName} {manuscript.authors?.[0]?.lastName}
                  </span>
                </div>
                {manuscript.keywords && manuscript.keywords.length > 0 && (
                  <div className="info-item">
                    <label>Keywords:</label>
                    <div className="keywords-list">
                      {manuscript.keywords.map((keyword, index) => (
                        <span key={index} className="keyword-tag">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Existing Reviews */}
            {existingReviews.length > 0 && (
              <Card>
                <div className="card-header">
                  <h2>
                    <i className="fas fa-clipboard-list"></i> Existing Reviews
                  </h2>
                </div>
                <div className="card-body">
                  <div className="existing-reviews-list">
                    {existingReviews.map((review) => (
                      <div key={review._id} className="existing-review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <i className="fas fa-user-tie"></i>
                            <span>
                              {review.reviewer?.firstName} {review.reviewer?.lastName}
                            </span>
                          </div>
                          <span className={`status-badge status-${review.status}`}>
                            {review.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="review-meta">
                          <span>
                            <i className="fas fa-calendar-plus"></i>
                            Assigned: {new Date(review.assignedAt).toLocaleDateString()}
                          </span>
                          {review.deadline && (
                            <span>
                              <i className="fas fa-hourglass-end"></i>
                              Deadline: {new Date(review.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Guidelines */}
            <Card>
              <div className="card-header">
                <h2>
                  <i className="fas fa-info-circle"></i> Assignment Guidelines
                </h2>
              </div>
              <div className="card-body guidelines">
                <ul>
                  <li>Assign at least <strong>2 reviewers</strong> per manuscript.</li>
                  <li>Select reviewers with expertise in the manuscript's subject area.</li>
                  <li>Avoid conflicts of interest (e.g., co-authors, same institution).</li>
                  <li>Provide a reasonable deadline (typically 14-21 days).</li>
                  <li>Reviewers will receive an email invitation with manuscript details.</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>

        {/* Confirm Dialog */}
        {showConfirmDialog && (
          <ConfirmDialog
            title="Send Review Invitations"
            message={`You are about to send review invitations to ${pendingAssignments?.reviewers.length} reviewer(s). They will receive an email with the manuscript details and review deadline. Continue?`}
            confirmText="Send Invitations"
            confirmVariant="primary"
            onConfirm={confirmAssignment}
            onCancel={() => setShowConfirmDialog(false)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default AssignReviewers;