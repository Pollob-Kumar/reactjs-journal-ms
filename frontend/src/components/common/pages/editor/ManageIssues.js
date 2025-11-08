import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './ManageIssues.css';

const ManageIssues = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [issues, setIssues] = useState([]);
  const [acceptedManuscripts, setAcceptedManuscripts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [expandedIssue, setExpandedIssue] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all issues
      const issuesResponse = await api.get('/issues');
      setIssues(issuesResponse.data);

      // Fetch accepted manuscripts not yet assigned to an issue
      const manuscriptsResponse = await api.get('/manuscripts?status=accepted&unassigned=true');
      setAcceptedManuscripts(manuscriptsResponse.data.manuscripts || manuscriptsResponse.data);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const issueValidationSchema = Yup.object({
    volume: Yup.number()
      .min(1, 'Volume must be at least 1')
      .required('Volume is required'),
    number: Yup.number()
      .min(1, 'Number must be at least 1')
      .required('Number is required'),
    year: Yup.number()
      .min(2000, 'Year must be 2000 or later')
      .max(2100, 'Year must be 2100 or earlier')
      .required('Year is required'),
    title: Yup.string()
      .min(3, 'Title must be at least 3 characters')
      .required('Title is required'),
    coverImage: Yup.string().url('Must be a valid URL')
  });

  const handleCreateIssue = async (values, { setSubmitting }) => {
    try {
      await api.post('/issues', values);
      alert('Issue created successfully!');
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      console.error('Error creating issue:', err);
      alert(err.response?.data?.message || 'Failed to create issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateIssue = async (values, { setSubmitting }) => {
    try {
      await api.put(`/issues/${selectedIssue._id}`, values);
      alert('Issue updated successfully!');
      setShowEditModal(false);
      setSelectedIssue(null);
      fetchData();
    } catch (err) {
      console.error('Error updating issue:', err);
      alert(err.response?.data?.message || 'Failed to update issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignManuscripts = async (manuscriptIds) => {
    try {
      await api.post(`/issues/${selectedIssue._id}/assign`, { manuscriptIds });
      alert('Manuscripts assigned successfully!');
      setShowAssignModal(false);
      setSelectedIssue(null);
      fetchData();
    } catch (err) {
      console.error('Error assigning manuscripts:', err);
      alert(err.response?.data?.message || 'Failed to assign manuscripts');
    }
  };

  const handlePublishIssue = async () => {
    try {
      await api.post(`/issues/${selectedIssue._id}/publish`);
      alert('Issue published successfully!');
      setShowPublishDialog(false);
      setSelectedIssue(null);
      fetchData();
    } catch (err) {
      console.error('Error publishing issue:', err);
      alert(err.response?.data?.message || 'Failed to publish issue');
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/issues/${issueId}`);
      alert('Issue deleted successfully!');
      fetchData();
    } catch (err) {
      console.error('Error deleting issue:', err);
      alert(err.response?.data?.message || 'Failed to delete issue');
    }
  };

  const openEditModal = (issue) => {
    setSelectedIssue(issue);
    setShowEditModal(true);
  };

  const openAssignModal = (issue) => {
    setSelectedIssue(issue);
    setShowAssignModal(true);
  };

  const openPublishDialog = (issue) => {
    setSelectedIssue(issue);
    setShowPublishDialog(true);
  };

  if (loading) return <Loading />;

  return (
    <MainLayout>
      <div className="manage-issues">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Manage Issues</h1>
            <p className="page-description">
              Create and manage journal issues for publication
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <i className="fas fa-plus"></i> Create New Issue
          </button>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Unassigned Manuscripts Alert */}
        {acceptedManuscripts.length > 0 && (
          <Card className="alert-card">
            <div className="alert-icon">
              <i className="fas fa-info-circle"></i>
            </div>
            <div className="alert-content">
              <h3>Unassigned Manuscripts</h3>
              <p>
                You have <strong>{acceptedManuscripts.length}</strong> accepted manuscript(s) waiting to be assigned to an issue.
              </p>
            </div>
          </Card>
        )}

        {/* Issues List */}
        {issues.length > 0 ? (
          <div className="issues-list">
            {issues.map((issue) => (
              <Card key={issue._id} className="issue-card">
                <div className="issue-header">
                  <div className="issue-title-section">
                    <h2>
                      Volume {issue.volume}, Number {issue.number} ({issue.year})
                    </h2>
                    <p className="issue-title">{issue.title}</p>
                  </div>
                  <div className="issue-status">
                    <span className={`status-badge ${issue.published ? 'published' : 'draft'}`}>
                      {issue.published ? (
                        <>
                          <i className="fas fa-check-circle"></i> Published
                        </>
                      ) : (
                        <>
                          <i className="fas fa-edit"></i> Draft
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="issue-meta">
                  <div className="meta-item">
                    <i className="fas fa-file-alt"></i>
                    <span>{issue.manuscripts?.length || 0} Articles</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-calendar"></i>
                    <span>
                      Created: {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {issue.publishedAt && (
                    <div className="meta-item">
                      <i className="fas fa-globe"></i>
                      <span>
                        Published: {new Date(issue.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Manuscripts in this issue */}
                {issue.manuscripts && issue.manuscripts.length > 0 && (
                  <div className="manuscripts-section">
                    <button
                      onClick={() => setExpandedIssue(expandedIssue === issue._id ? null : issue._id)}
                      className="expand-toggle"
                    >
                      <i className={`fas fa-chevron-${expandedIssue === issue._id ? 'up' : 'down'}`}></i>
                      {expandedIssue === issue._id ? 'Hide' : 'Show'} Articles
                    </button>

                    {expandedIssue === issue._id && (
                      <div className="manuscripts-list">
                        {issue.manuscripts.map((manuscript, index) => (
                          <div key={manuscript._id} className="manuscript-item">
                            <span className="manuscript-number">{index + 1}</span>
                            <div className="manuscript-info">
                              <h4>{manuscript.title}</h4>
                              <p>
                                {manuscript.authors?.[0]?.firstName} {manuscript.authors?.[0]?.lastName}
                                {manuscript.authors?.length > 1 && ` et al.`}
                              </p>
                              {manuscript.doi && (
                                <p className="doi">
                                  <i className="fas fa-link"></i> DOI: {manuscript.doi}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Issue Actions */}
                <div className="issue-actions">
                  {!issue.published && (
                    <>
                      <button
                        onClick={() => openEditModal(issue)}
                        className="btn btn-outline btn-sm"
                      >
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button
                        onClick={() => openAssignModal(issue)}
                        className="btn btn-primary btn-sm"
                      >
                        <i className="fas fa-paperclip"></i> Assign Articles
                      </button>
                      {issue.manuscripts && issue.manuscripts.length > 0 && (
                        <button
                          onClick={() => openPublishDialog(issue)}
                          className="btn btn-success btn-sm"
                        >
                          <i className="fas fa-globe"></i> Publish Issue
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteIssue(issue._id)}
                        className="btn btn-danger btn-sm"
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </>
                  )}
                  {issue.published && (
                    <button className="btn btn-outline btn-sm">
                      <i className="fas fa-eye"></i> View Public Page
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="empty-state">
            <i className="fas fa-book-open empty-icon"></i>
            <h3>No Issues Created Yet</h3>
            <p>Get started by creating your first journal issue.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <i className="fas fa-plus"></i> Create First Issue
            </button>
          </Card>
        )}

        {/* Create Issue Modal */}
        {showCreateModal && (
          <Modal
            title="Create New Issue"
            onClose={() => setShowCreateModal(false)}
          >
            <Formik
              initialValues={{
                volume: issues.length > 0 ? Math.max(...issues.map(i => i.volume)) : 1,
                number: 1,
                year: new Date().getFullYear(),
                title: '',
                coverImage: ''
              }}
              validationSchema={issueValidationSchema}
              onSubmit={handleCreateIssue}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="issue-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="volume">Volume *</label>
                      <Field
                        type="number"
                        name="volume"
                        id="volume"
                        className={`form-input ${errors.volume && touched.volume ? 'error' : ''}`}
                      />
                      {errors.volume && touched.volume && (
                        <div className="error-message">{errors.volume}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="number">Number *</label>
                      <Field
                        type="number"
                        name="number"
                        id="number"
                        className={`form-input ${errors.number && touched.number ? 'error' : ''}`}
                      />
                      {errors.number && touched.number && (
                        <div className="error-message">{errors.number}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="year">Year *</label>
                      <Field
                        type="number"
                        name="year"
                        id="year"
                        className={`form-input ${errors.year && touched.year ? 'error' : ''}`}
                      />
                      {errors.year && touched.year && (
                        <div className="error-message">{errors.year}</div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="title">Issue Title *</label>
                    <Field
                      type="text"
                      name="title"
                      id="title"
                      placeholder="e.g., Special Issue on Artificial Intelligence"
                      className={`form-input ${errors.title && touched.title ? 'error' : ''}`}
                    />
                    {errors.title && touched.title && (
                      <div className="error-message">{errors.title}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="coverImage">
                      Cover Image URL (Optional)
                    </label>
                    <Field
                      type="text"
                      name="coverImage"
                      id="coverImage"
                      placeholder="https://example.com/cover.jpg"
                      className={`form-input ${errors.coverImage && touched.coverImage ? 'error' : ''}`}
                    />
                    {errors.coverImage && touched.coverImage && (
                      <div className="error-message">{errors.coverImage}</div>
                    )}
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="btn btn-outline"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Issue'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </Modal>
        )}

        {/* Edit Issue Modal */}
        {showEditModal && selectedIssue && (
          <Modal
            title="Edit Issue"
            onClose={() => {
              setShowEditModal(false);
              setSelectedIssue(null);
            }}
          >
            <Formik
              initialValues={{
                volume: selectedIssue.volume,
                number: selectedIssue.number,
                year: selectedIssue.year,
                title: selectedIssue.title,
                coverImage: selectedIssue.coverImage || ''
              }}
              validationSchema={issueValidationSchema}
              onSubmit={handleUpdateIssue}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="issue-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="volume">Volume *</label>
                      <Field
                        type="number"
                        name="volume"
                        id="volume"
                        className={`form-input ${errors.volume && touched.volume ? 'error' : ''}`}
                      />
                      {errors.volume && touched.volume && (
                        <div className="error-message">{errors.volume}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="number">Number *</label>
                      <Field
                        type="number"
                        name="number"
                        id="number"
                        className={`form-input ${errors.number && touched.number ? 'error' : ''}`}
                      />
                      {errors.number && touched.number && (
                        <div className="error-message">{errors.number}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="year">Year *</label>
                      <Field
                        type="number"
                        name="year"
                        id="year"
                        className={`form-input ${errors.year && touched.year ? 'error' : ''}`}
                      />
                      {errors.year && touched.year && (
                        <div className="error-message">{errors.year}</div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="title">Issue Title *</label>
                    <Field
                      type="text"
                      name="title"
                      id="title"
                      className={`form-input ${errors.title && touched.title ? 'error' : ''}`}
                    />
                    {errors.title && touched.title && (
                      <div className="error-message">{errors.title}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="coverImage">Cover Image URL (Optional)</label>
                    <Field
                      type="text"
                      name="coverImage"
                      id="coverImage"
                      className={`form-input ${errors.coverImage && touched.coverImage ? 'error' : ''}`}
                    />
                    {errors.coverImage && touched.coverImage && (
                      <div className="error-message">{errors.coverImage}</div>
                    )}
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedIssue(null);
                      }}
                      className="btn btn-outline"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Updating...' : 'Update Issue'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </Modal>
        )}

        {/* Assign Manuscripts Modal */}
        {showAssignModal && selectedIssue && (
          <AssignManuscriptsModal
            issue={selectedIssue}
            availableManuscripts={acceptedManuscripts}
            onClose={() => {
              setShowAssignModal(false);
              setSelectedIssue(null);
            }}
            onAssign={handleAssignManuscripts}
          />
        )}

        {/* Publish Confirm Dialog */}
        {showPublishDialog && selectedIssue && (
          <ConfirmDialog
            title="Publish Issue"
            message={`Are you sure you want to publish Volume ${selectedIssue.volume}, Number ${selectedIssue.number}? This will make all ${selectedIssue.manuscripts?.length} article(s) publicly accessible and assign DOIs.`}
            confirmText="Publish Issue"
            confirmVariant="success"
            onConfirm={handlePublishIssue}
            onCancel={() => {
              setShowPublishDialog(false);
              setSelectedIssue(null);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

// Assign Manuscripts Modal Component
const AssignManuscriptsModal = ({ issue, availableManuscripts, onClose, onAssign }) => {
  const [selectedManuscripts, setSelectedManuscripts] = useState([]);

  const toggleManuscript = (manuscriptId) => {
    setSelectedManuscripts(prev =>
      prev.includes(manuscriptId)
        ? prev.filter(id => id !== manuscriptId)
        : [...prev, manuscriptId]
    );
  };

  const handleAssign = () => {
    if (selectedManuscripts.length === 0) {
      alert('Please select at least one manuscript');
      return;
    }
    onAssign(selectedManuscripts);
  };

  return (
    <Modal
      title={`Assign Articles to Volume ${issue.volume}, Number ${issue.number}`}
      onClose={onClose}
      size="large"
    >
      <div className="assign-manuscripts-modal">
        {availableManuscripts.length > 0 ? (
          <>
            <p className="modal-description">
              Select manuscripts to include in this issue:
            </p>
            <div className="manuscripts-selection-list">
              {availableManuscripts.map((manuscript) => (
                <label key={manuscript._id} className="manuscript-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedManuscripts.includes(manuscript._id)}
                    onChange={() => toggleManuscript(manuscript._id)}
                  />
                  <div className="manuscript-info">
                    <h4>{manuscript.title}</h4>
                    <p>
                      <i className="fas fa-user"></i>
                      {manuscript.authors?.[0]?.firstName} {manuscript.authors?.[0]?.lastName}
                      {manuscript.authors?.length > 1 && ` et al.`}
                    </p>
                    <p className="manuscript-id">
                      <i className="fas fa-hashtag"></i>
                      {manuscript.manuscriptId}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="selection-summary">
              Selected: <strong>{selectedManuscripts.length}</strong> manuscript(s)
            </div>
          </>
        ) : (
          <div className="empty-message">
            <i className="fas fa-inbox"></i>
            <p>No accepted manuscripts available for assignment.</p>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button
            onClick={handleAssign}
            className="btn btn-primary"
            disabled={selectedManuscripts.length === 0}
          >
            <i className="fas fa-check"></i> Assign {selectedManuscripts.length} Article(s)
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ManageIssues;