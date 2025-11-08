import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage as FormikError } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import Card from '../../components/common/Card';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './SubmitReview.css';

const SubmitReview = () => {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [review, setReview] = useState(null);
  const [manuscript, setManuscript] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  useEffect(() => {
    fetchReviewDetails();
  }, [reviewId]);

  const fetchReviewDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const reviewResponse = await api.get(`/reviews/${reviewId}`);
      setReview(reviewResponse.data);

      if (reviewResponse.data.manuscript?._id) {
        const manuscriptResponse = await api.get(
          `/manuscripts/${reviewResponse.data.manuscript._id}`
        );
        setManuscript(manuscriptResponse.data);
      }
    } catch (err) {
      console.error('Error fetching review details:', err);
      setError(err.response?.data?.message || 'Failed to load review details');
    } finally {
      setLoading(false);
    }
  };

  const validationSchema = Yup.object({
    // Rating scales (1-5)
    ratingOriginality: Yup.number()
      .min(1, 'Please select a rating')
      .max(5)
      .required('Originality rating is required'),
    ratingMethodology: Yup.number()
      .min(1, 'Please select a rating')
      .max(5)
      .required('Methodology rating is required'),
    ratingClarity: Yup.number()
      .min(1, 'Please select a rating')
      .max(5)
      .required('Clarity rating is required'),
    ratingSignificance: Yup.number()
      .min(1, 'Please select a rating')
      .max(5)
      .required('Significance rating is required'),

    // Comments
    commentsForAuthor: Yup.string()
      .min(50, 'Comments for author must be at least 50 characters')
      .required('Comments for author are required'),
    commentsForEditor: Yup.string()
      .min(20, 'Confidential comments must be at least 20 characters')
      .required('Confidential comments for editor are required'),

    // Recommendation
    recommendation: Yup.string()
      .oneOf(['accept', 'minor_revision', 'major_revision', 'reject'])
      .required('Please select a recommendation')
  });

  const initialValues = {
    ratingOriginality: review?.ratings?.originality || 0,
    ratingMethodology: review?.ratings?.methodology || 0,
    ratingClarity: review?.ratings?.clarity || 0,
    ratingSignificance: review?.ratings?.significance || 0,
    commentsForAuthor: review?.commentsForAuthor || '',
    commentsForEditor: review?.commentsForEditor || '',
    recommendation: review?.recommendation || ''
  };

  const handleSubmit = (values) => {
    setSubmittedData(values);
    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    try {
      const payload = {
        ratings: {
          originality: submittedData.ratingOriginality,
          methodology: submittedData.ratingMethodology,
          clarity: submittedData.ratingClarity,
          significance: submittedData.ratingSignificance
        },
        commentsForAuthor: submittedData.commentsForAuthor,
        commentsForEditor: submittedData.commentsForEditor,
        recommendation: submittedData.recommendation,
        status: 'completed'
      };

      await api.put(`/reviews/${reviewId}/submit`, payload);
      
      // Show success and redirect
      alert('Review submitted successfully!');
      navigate('/reviewer/reviews');
    } catch (err) {
      console.error('Error submitting review:', err);
      alert(err.response?.data?.message || 'Failed to submit review');
      setShowConfirmDialog(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!review || !manuscript) return <ErrorMessage message="Review not found" />;

  // Check if review can be submitted
  if (review.status !== 'in_progress') {
    return (
      <MainLayout>
        <div className="submit-review">
          <Card className="error-card">
            <i className="fas fa-exclamation-triangle"></i>
            <h2>Cannot Submit Review</h2>
            <p>
              {review.status === 'completed'
                ? 'This review has already been submitted.'
                : 'This review invitation has not been accepted yet.'}
            </p>
            <button onClick={() => navigate(-1)} className="btn btn-primary">
              Go Back
            </button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="submit-review">
        {/* Header */}
        <div className="page-header">
          <div>
            <button onClick={() => navigate(-1)} className="btn-back">
              <i className="fas fa-arrow-left"></i> Back to Review Details
            </button>
            <h1>Submit Review</h1>
            <p className="manuscript-title">{manuscript.title}</p>
          </div>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="review-form">
              {/* Rating Scales Section */}
              <Card>
                <div className="card-header">
                  <h2>
                    <i className="fas fa-star"></i> Evaluation Criteria
                  </h2>
                  <span className="required-note">All ratings are required (1-5 scale)</span>
                </div>
                <div className="card-body">
                  <p className="rating-instruction">
                    Please rate the manuscript on the following criteria where:
                    <strong> 1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent</strong>
                  </p>

                  {/* Originality */}
                  <div className="rating-group">
                    <label htmlFor="ratingOriginality">
                      1. Originality
                      <span className="rating-description">
                        Is the research novel and does it contribute new knowledge to the field?
                      </span>
                    </label>
                    <div className="rating-scale">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <label key={rating} className="rating-option">
                          <Field
                            type="radio"
                            name="ratingOriginality"
                            value={rating}
                            checked={values.ratingOriginality === rating}
                            onChange={() => setFieldValue('ratingOriginality', rating)}
                          />
                          <span className="rating-label">
                            <span className="rating-number">{rating}</span>
                            <span className="rating-text">
                              {rating === 1 && 'Poor'}
                              {rating === 2 && 'Fair'}
                              {rating === 3 && 'Good'}
                              {rating === 4 && 'Very Good'}
                              {rating === 5 && 'Excellent'}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <FormikError name="ratingOriginality" component="div" className="error-message" />
                  </div>

                  {/* Methodology */}
                  <div className="rating-group">
                    <label htmlFor="ratingMethodology">
                      2. Methodology
                      <span className="rating-description">
                        Are the research methods sound, appropriate, and well-executed?
                      </span>
                    </label>
                    <div className="rating-scale">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <label key={rating} className="rating-option">
                          <Field
                            type="radio"
                            name="ratingMethodology"
                            value={rating}
                            checked={values.ratingMethodology === rating}
                            onChange={() => setFieldValue('ratingMethodology', rating)}
                          />
                          <span className="rating-label">
                            <span className="rating-number">{rating}</span>
                            <span className="rating-text">
                              {rating === 1 && 'Poor'}
                              {rating === 2 && 'Fair'}
                              {rating === 3 && 'Good'}
                              {rating === 4 && 'Very Good'}
                              {rating === 5 && 'Excellent'}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <FormikError name="ratingMethodology" component="div" className="error-message" />
                  </div>

                  {/* Clarity */}
                  <div className="rating-group">
                    <label htmlFor="ratingClarity">
                      3. Clarity & Presentation
                      <span className="rating-description">
                        Is the manuscript well-written, organized, and easy to understand?
                      </span>
                    </label>
                    <div className="rating-scale">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <label key={rating} className="rating-option">
                          <Field
                            type="radio"
                            name="ratingClarity"
                            value={rating}
                            checked={values.ratingClarity === rating}
                            onChange={() => setFieldValue('ratingClarity', rating)}
                          />
                          <span className="rating-label">
                            <span className="rating-number">{rating}</span>
                            <span className="rating-text">
                              {rating === 1 && 'Poor'}
                              {rating === 2 && 'Fair'}
                              {rating === 3 && 'Good'}
                              {rating === 4 && 'Very Good'}
                              {rating === 5 && 'Excellent'}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <FormikError name="ratingClarity" component="div" className="error-message" />
                  </div>

                  {/* Significance */}
                  <div className="rating-group">
                    <label htmlFor="ratingSignificance">
                      4. Significance & Impact
                      <span className="rating-description">
                        Is the research important and relevant to the journal's scope?
                      </span>
                    </label>
                    <div className="rating-scale">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <label key={rating} className="rating-option">
                          <Field
                            type="radio"
                            name="ratingSignificance"
                            value={rating}
                            checked={values.ratingSignificance === rating}
                            onChange={() => setFieldValue('ratingSignificance', rating)}
                          />
                          <span className="rating-label">
                            <span className="rating-number">{rating}</span>
                            <span className="rating-text">
                              {rating === 1 && 'Poor'}
                              {rating === 2 && 'Fair'}
                              {rating === 3 && 'Good'}
                              {rating === 4 && 'Very Good'}
                              {rating === 5 && 'Excellent'}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <FormikError name="ratingSignificance" component="div" className="error-message" />
                  </div>

                  {/* Average Rating Display */}
                  {values.ratingOriginality > 0 &&
                    values.ratingMethodology > 0 &&
                    values.ratingClarity > 0 &&
                    values.ratingSignificance > 0 && (
                    <div className="average-rating">
                      <strong>Overall Average Rating:</strong>
                      <span className="average-score">
                        {(
                          (values.ratingOriginality +
                            values.ratingMethodology +
                            values.ratingClarity +
                            values.ratingSignificance) /
                          4
                        ).toFixed(2)}{' '}
                        / 5.00
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Comments for Author */}
              <Card>
                <div className="card-header">
                  <h2>
                    <i className="fas fa-comments"></i> Comments for Author
                  </h2>
                  <span className="public-badge">
                    <i className="fas fa-eye"></i> Visible to Author (Anonymized)
                  </span>
                </div>
                <div className="card-body">
                  <p className="field-instruction">
                    Provide constructive feedback to help the author improve their manuscript.
                    These comments will be shared with the author <strong>anonymously</strong>.
                  </p>
                  <Field
                    as="textarea"
                    name="commentsForAuthor"
                    rows="10"
                    className="form-textarea"
                    placeholder="Enter your detailed feedback for the author here..."
                  />
                  <div className="char-count">
                    {values.commentsForAuthor.length} characters (minimum 50 required)
                  </div>
                  <FormikError name="commentsForAuthor" component="div" className="error-message" />
                </div>
              </Card>

              {/* Confidential Comments for Editor */}
              <Card>
                <div className="card-header">
                  <h2>
                    <i className="fas fa-lock"></i> Confidential Comments for Editor
                  </h2>
                  <span className="confidential-badge">
                    <i className="fas fa-eye-slash"></i> Confidential - Editor Only
                  </span>
                </div>
                <div className="card-body">
                  <p className="field-instruction">
                    Provide confidential comments that will only be visible to the editor.
                    Include any concerns or recommendations that should not be shared with the author.
                  </p>
                  <Field
                    as="textarea"
                    name="commentsForEditor"
                    rows="6"
                    className="form-textarea"
                    placeholder="Enter your confidential comments for the editor here..."
                  />
                  <div className="char-count">
                    {values.commentsForEditor.length} characters (minimum 20 required)
                  </div>
                  <FormikError name="commentsForEditor" component="div" className="error-message" />
                </div>
              </Card>

              {/* Recommendation */}
              <Card>
                <div className="card-header">
                  <h2>
                    <i className="fas fa-clipboard-check"></i> Final Recommendation
                  </h2>
                </div>
                <div className="card-body">
                  <p className="field-instruction">
                    Based on your evaluation, please select your recommendation for this manuscript:
                  </p>
                  <div className="recommendation-options">
                    <label className="recommendation-option">
                      <Field
                        type="radio"
                        name="recommendation"
                        value="accept"
                      />
                      <div className="option-content accept">
                        <div className="option-icon">
                          <i className="fas fa-check-circle"></i>
                        </div>
                        <div className="option-text">
                          <strong>Accept</strong>
                          <p>The manuscript is ready for publication with no changes required</p>
                        </div>
                      </div>
                    </label>

                    <label className="recommendation-option">
                      <Field
                        type="radio"
                        name="recommendation"
                        value="minor_revision"
                      />
                      <div className="option-content minor">
                        <div className="option-icon">
                          <i className="fas fa-edit"></i>
                        </div>
                        <div className="option-text">
                          <strong>Minor Revision</strong>
                          <p>Small changes needed; likely acceptable after revision</p>
                        </div>
                      </div>
                    </label>

                    <label className="recommendation-option">
                      <Field
                        type="radio"
                        name="recommendation"
                        value="major_revision"
                      />
                      <div className="option-content major">
                        <div className="option-icon">
                          <i className="fas fa-sync-alt"></i>
                        </div>
                        <div className="option-text">
                          <strong>Major Revision</strong>
                          <p>Significant changes required; needs another round of review</p>
                        </div>
                      </div>
                    </label>

                    <label className="recommendation-option">
                      <Field
                        type="radio"
                        name="recommendation"
                        value="reject"
                      />
                      <div className="option-content reject">
                        <div className="option-icon">
                          <i className="fas fa-times-circle"></i>
                        </div>
                        <div className="option-text">
                          <strong>Reject</strong>
                          <p>The manuscript is not suitable for publication in this journal</p>
                        </div>
                      </div>
                    </label>
                  </div>
                  <FormikError name="recommendation" component="div" className="error-message" />
                </div>
              </Card>

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn btn-outline"
                  disabled={isSubmitting}
                >
                  <i className="fas fa-times"></i> Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success btn-lg"
                  disabled={isSubmitting}
                >
                  <i className="fas fa-paper-plane"></i> Submit Review
                </button>
              </div>
            </Form>
          )}
        </Formik>

        {/* Confirm Dialog */}
        {showConfirmDialog && (
          <ConfirmDialog
            title="Submit Review"
            message="Are you sure you want to submit this review? Once submitted, you cannot make any changes."
            confirmText="Yes, Submit Review"
            confirmVariant="success"
            onConfirm={confirmSubmit}
            onCancel={() => setShowConfirmDialog(false)}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default SubmitReview;