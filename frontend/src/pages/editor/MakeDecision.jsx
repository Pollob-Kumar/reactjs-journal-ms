import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout.jsx';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Card from '../../components/common/Card.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import './MakeDecision.css';

const MakeDecision = () => {
  const { manuscriptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manuscript, setManuscript] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDecision, setPendingDecision] = useState(null);

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

      // Fetch all reviews for this manuscript
      const reviewsResponse = await api.get(`/reviews/manuscript/${manuscriptId}`);
      setReviews(reviewsResponse.data || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const validationSchema = Yup.object({
    decision: Yup.string()
      .oneOf(['accept', 'reject', 'major_revision', 'minor_revision'])
      .required('Decision is required'),
    decisionLetter: Yup.string()
      .min(50, 'Decision letter must be at least 50 characters')
      .required('Decision letter is required'),
    editorComments: Yup.string()
      .min(20, 'Editor comments must be at least 20 characters')
  });

  const getDecisionTemplate = (decision) => {
    const templates = {
      accept: `Dear Author,

We are pleased to inform you that your manuscript "${manuscript?.title}" has been ACCEPTED for publication in the Journal of Pundra University of Science & Technology.

The reviewers have found your work to be of high quality and significant contribution to the field. Your manuscript will be included in an upcoming issue.

Next steps:
1. You will receive further instructions regarding the final publication process.
2. Please review the attached reviewer comments for any minor suggestions.
3. A DOI will be assigned to your article upon publication.

Congratulations on this achievement!

Best regards,
Editorial Board
Journal of Pundra University of Science & Technology`,

      reject: `Dear Author,

After careful consideration and peer review, we regret to inform you that your manuscript "${manuscript?.title}" has been REJECTED for publication in the Journal of Pundra University of Science & Technology.

While we appreciate your interest in our journal, the reviewers have identified significant concerns that prevent us from accepting the manuscript for publication. Please find the detailed reviewer comments below for your reference.

We encourage you to consider the feedback and wish you success in placing your work elsewhere.

Best regards,
Editorial Board
Journal of Pundra University of Science & Technology`,

      major_revision: `Dear Author,

Your manuscript "${manuscript?.title}" has been reviewed, and the editorial decision is MAJOR REVISION REQUIRED.

The reviewers have identified substantial issues that need to be addressed before the manuscript can be reconsidered for publication. Please carefully review all comments and make the necessary revisions.

Requirements for resubmission:
1. Address all reviewer comments point-by-point
2. Submit a detailed "Response to Reviewers" document
3. Upload the revised manuscript with changes highlighted
4. Resubmit within 60 days

The revised manuscript will undergo another round of peer review.

Best regards,
Editorial Board
Journal of Pundra University of Science & Technology`,

      minor_revision: `Dear Author,

Your manuscript "${manuscript?.title}" has been reviewed, and the editorial decision is MINOR REVISION REQUIRED.

The reviewers have found your work to be generally sound but have identified some minor improvements that should be addressed. Please review the comments carefully and make the necessary revisions.

Requirements for resubmission:
1. Address all reviewer comments
2. Submit a brief "Response to Reviewers" document
3. Upload the revised manuscript
4. Resubmit within 30 days

Upon satisfactory revision, your manuscript will likely be accepted for publication.

Best regards,
Editorial Board
Journal of Pundra University of Science & Technology`
    };

    return templates[decision] || '';
  };

  const getRecommendationSummary = () => {
    const completedReviews = reviews.filter(r => r.status === 'completed');
    const summary = {
      accept: 0,
      minor_revision: 0,
      major_revision: 0,
      reject: 0,
      total: completedReviews.length
    };

    completedReviews.forEach(review => {
      if (review.recommendation) {
        summary[review.recommendation]++;
      }
    });

    return summary;
  };

  const getAverageRating = () => {
    const completedReviews = reviews.filter(r => r.status === 'completed' && r.ratings);
    if (completedReviews.length === 0) return null;

    const totalRatings = completedReviews.reduce((acc, review) => {
      const avg = (
        (review.ratings.originality || 0) +
        (review.ratings.methodology || 0) +
        (review.ratings.clarity || 0) +
        (review.ratings.significance || 0)
      ) / 4;
      return acc + avg;
    }, 0);

    return (totalRatings / completedReviews.length).toFixed(2);
  };

  const handleSubmit = (values) => {
    setPendingDecision(values);
    setShowConfirmDialog(true);
  };

  const confirmDecision = async () => {
    try {
      await api.put(`/manuscripts/${manuscriptId}/decision`, {
        status: pendingDecision.decision === 'accept' ? 'accepted' :
                pendingDecision.decision === 'reject' ? 'rejected' : 'revision_required',
        decision: pendingDecision.decision,
        decisionLetter: pendingDecision.decisionLetter,
        editorComments: pendingDecision.editorComments
      });

      alert('Editorial decision submitted successfully!');
      navigate('/editor/submissions');
    } catch (err) {
      console.error('Error submitting decision:', err);
      alert(err.response?.data?.message || 'Failed to submit decision');
      setShowConfirmDialog(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!manuscript) return <ErrorMessage message="Manuscript not found" />;

  const recommendationSummary = getRecommendationSummary();
  const averageRating = getAverageRating();
  const completedReviews = reviews.filter(r => r.status === 'completed');

  return (
    <MainLayout>
      <div className="make-decision">
        {/* Header */}
        <div className="page-header">
          <div>
            <button onClick={() => navigate(-1)} className="btn-back">
              <i className="fas fa-arrow-left"></i> Back to Submissions
            </button>
            <h1>Editorial Decision</h1>
            <p className="manuscript-title">{manuscript.title}</p>
          </div>
        </div>

        <div className="content-grid">
          {/* Left Column - Reviews Summary */}
          <div className="left-column">
            {/* Manuscript Info */}
            <Card>
              <div className="card-header">
                <h2>
                  <i className="fas fa-file-alt"></i> Manuscript Information
                </h2>
              </div>
              <div className="card-body">
                <div className="info-grid">
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
                  <div className="info-item">
                    <label>Current Status:</label>
                    <StatusBadge status={manuscript.status} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Review Summary */}
            <Card>
              <div className="card-header">
                <h2>
                  <i className="fas fa-chart-bar"></i> Review Summary
                </h2>
              </div>
              <div className="card-body">
                <div className="summary-stats">
                  <div className="stat-item">
                    <div className="stat-icon">
                      <i className="fas fa-clipboard-check"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{completedReviews.length} / {reviews.length}</h3>
                      <p>Reviews Completed</p>
                    </div>
                  </div>

                  {averageRating && (
                    <div className="stat-item">
                      <div className="stat-icon">
                        <i className="fas fa-star"></i>
                      </div>
                      <div className="stat-content">
                        <h3>{averageRating} / 5.00</h3>
                        <p>Average Rating</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommendation Distribution */}
                <div className="recommendation-chart">
                  <h3>Reviewer Recommendations</h3>
                  <div className="chart-bars">
                    <div className="chart-bar">
                      <div className="bar-label">
                        <i className="fas fa-check-circle"></i> Accept
                      </div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill accept"
                          style={{ width: `${(recommendationSummary.accept / recommendationSummary.total) * 100}%` }}
                        >
                          {recommendationSummary.accept}
                        </div>
                      </div>
                    </div>

                    <div className="chart-bar">
                      <div className="bar-label">
                        <i className="fas fa-edit"></i> Minor Revision
                      </div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill minor"
                          style={{ width: `${(recommendationSummary.minor_revision / recommendationSummary.total) * 100}%` }}
                        >
                          {recommendationSummary.minor_revision}
                        </div>
                      </div>
                    </div>

                    <div className="chart-bar">
                      <div className="bar-label">
                        <i className="fas fa-sync-alt"></i> Major Revision
                      </div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill major"
                          style={{ width: `${(recommendationSummary.major_revision / recommendationSummary.total) * 100}%` }}
                        >
                          {recommendationSummary.major_revision}
                        </div>
                      </div>
                    </div>

                    <div className="chart-bar">
                      <div className="bar-label">
                        <i className="fas fa-times-circle"></i> Reject
                      </div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill reject"
                          style={{ width: `${(recommendationSummary.reject / recommendationSummary.total) * 100}%` }}
                        >
                          {recommendationSummary.reject}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Individual Reviews */}
            <Card>
              <div className="card-header">
                <h2>
                  <i className="fas fa-comments"></i> Reviewer Comments
                </h2>
              </div>
              <div className="card-body">
                {completedReviews.length > 0 ? (
                  <div className="reviews-list">
                    {completedReviews.map((review, index) => (
                      <div key={review._id} className="review-detail">
                        <div className="review-header">
                          <h4>Reviewer {index + 1}</h4>
                          <span className={`recommendation-badge ${review.recommendation}`}>
                            {review.recommendation?.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Ratings */}
                        {review.ratings && (
                          <div className="ratings-grid">
                            <div className="rating-item">
                              <label>Originality:</label>
                              <span className="rating-value">{review.ratings.originality} / 5</span>
                            </div>
                            <div className="rating-item">
                              <label>Methodology:</label>
                              <span className="rating-value">{review.ratings.methodology} / 5</span>
                            </div>
                            <div className="rating-item">
                              <label>Clarity:</label>
                              <span className="rating-value">{review.ratings.clarity} / 5</span>
                            </div>
                            <div className="rating-item">
                              <label>Significance:</label>
                              <span className="rating-value">{review.ratings.significance} / 5</span>
                            </div>
                          </div>
                        )}

                        {/* Comments */}
                        <div className="comments-section">
                          <div className="comment-block">
                            <h5>
                              <i className="fas fa-eye"></i> Comments for Author
                            </h5>
                            <p>{review.commentsForAuthor}</p>
                          </div>

                          <div className="comment-block confidential">
                            <h5>
                              <i className="fas fa-lock"></i> Confidential Comments for Editor
                            </h5>
                            <p>{review.commentsForEditor}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>No completed reviews available yet.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Decision Form */}
          <div className="right-column">
            <Card className="decision-card">
              <div className="card-header">
                <h2>
                  <i className="fas fa-gavel"></i> Make Editorial Decision
                </h2>
              </div>
              <div className="card-body">
                <Formik
                  initialValues={{
                    decision: '',
                    decisionLetter: '',
                    editorComments: ''
                  }}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ values, errors, touched, setFieldValue }) => (
                    <Form className="decision-form">
                      {/* Decision Selection */}
                      <div className="form-section">
                        <label className="section-label">Select Decision *</label>
                        <div className="decision-options">
                          <label className="decision-option">
                            <Field type="radio" name="decision" value="accept" />
                            <div className="option-card accept">
                              <i className="fas fa-check-circle"></i>
                              <h4>Accept</h4>
                              <p>Accept for publication</p>
                            </div>
                          </label>

                          <label className="decision-option">
                            <Field type="radio" name="decision" value="minor_revision" />
                            <div className="option-card minor">
                              <i className="fas fa-edit"></i>
                              <h4>Minor Revision</h4>
                              <p>Small changes needed</p>
                            </div>
                          </label>

                          <label className="decision-option">
                            <Field type="radio" name="decision" value="major_revision" />
                            <div className="option-card major">
                              <i className="fas fa-sync-alt"></i>
                              <h4>Major Revision</h4>
                              <p>Significant changes required</p>
                            </div>
                          </label>

                          <label className="decision-option">
                            <Field type="radio" name="decision" value="reject" />
                            <div className="option-card reject">
                              <i className="fas fa-times-circle"></i>
                              <h4>Reject</h4>
                              <p>Not suitable for publication</p>
                            </div>
                          </label>
                        </div>
                        {errors.decision && touched.decision && (
                          <div className="error-message">{errors.decision}</div>
                        )}
                      </div>

                      {/* Auto-fill template button */}
                      {values.decision && (
                        <button
                          type="button"
                          onClick={() => setFieldValue('decisionLetter', getDecisionTemplate(values.decision))}
                          className="btn btn-outline btn-sm"
                        >
                          <i className="fas fa-file-alt"></i> Use Template
                        </button>
                      )}

                      {/* Decision Letter */}
                      <div className="form-section">
                        <label htmlFor="decisionLetter" className="section-label">
                          Decision Letter (to Author) *
                        </label>
                        <Field
                          as="textarea"
                          name="decisionLetter"
                          id="decisionLetter"
                          rows="12"
                          className={`form-textarea ${errors.decisionLetter && touched.decisionLetter ? 'error' : ''}`}
                          placeholder="Enter the decision letter that will be sent to the author..."
                        />
                        <div className="char-count">
                          {values.decisionLetter.length} characters
                        </div>
                        {errors.decisionLetter && touched.decisionLetter && (
                          <div className="error-message">{errors.decisionLetter}</div>
                        )}
                      </div>

                      {/* Editor Comments (Optional) */}
                      <div className="form-section">
                        <label htmlFor="editorComments" className="section-label">
                          Internal Notes (Optional)
                          <span className="label-hint">For editorial records only</span>
                        </label>
                        <Field
                          as="textarea"
                          name="editorComments"
                          id="editorComments"
                          rows="4"
                          className="form-textarea"
                          placeholder="Add any internal notes or comments for editorial records..."
                        />
                      </div>

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
                          <i className="fas fa-paper-plane"></i> Submit Decision
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </Card>
          </div>
        </div>

        {/* Confirm Dialog */}
        {showConfirmDialog && (
          <ConfirmDialog
            title="Confirm Editorial Decision"
            message={`Are you sure you want to ${pendingDecision?.decision.replace('_', ' ').toUpperCase()} this manuscript? This decision will be sent to the author and cannot be undone.`}
            confirmText="Yes, Submit Decision"
            confirmVariant={pendingDecision?.decision === 'accept' ? 'success' : 'primary'}
            onConfirm={confirmDecision}
            onCancel={() => setShowConfirmDialog(false)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default MakeDecision;