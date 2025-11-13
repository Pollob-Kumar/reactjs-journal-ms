import React, { useState, useEffect } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout.jsx';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Card from '../../components/common/Card.jsx';
import './SystemSettings.css';

const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [settings, setSettings] = useState({
    journalInfo: {
      name: '',
      abbreviation: '',
      issn: '',
      publisher: '',
      description: '',
      website: '',
      email: ''
    },
    emailSettings: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: ''
    },
    submissionSettings: {
      allowSubmissions: true,
      maxFileSize: 50,
      allowedFileTypes: ['.pdf', '.docx'],
      requireORCID: false,
      autoAssignManuscriptId: true
    },
    reviewSettings: {
      minReviewers: 2,
      reviewDeadlineDays: 14,
      sendReviewReminders: true,
      reminderDays: 3,
      blindReviewType: 'double' // double, single, open
    }
  });

  const [activeTab, setActiveTab] = useState('journal');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/admin/settings');
      setSettings(response.data);

    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (values, section) => {
    try {
      setSuccess(null);
      setError(null);

      await api.put('/admin/settings', {
        section,
        settings: values
      });

      setSuccess('Settings saved successfully!');
      fetchSettings();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.message || 'Failed to save settings');
    }
  };

  if (loading) return <Loading />;

  return (
    <MainLayout>
      <div className="system-settings">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>System Settings</h1>
            <p className="page-description">
              Configure system-wide settings and preferences
            </p>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}
        {success && (
          <div className="success-message">
            <i className="fas fa-check-circle"></i> {success}
          </div>
        )}

        {/* Settings Tabs */}
        <div className="settings-tabs">
          <button
            onClick={() => setActiveTab('journal')}
            className={`tab-button ${activeTab === 'journal' ? 'active' : ''}`}
          >
            <i className="fas fa-book"></i> Journal Info
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`tab-button ${activeTab === 'email' ? 'active' : ''}`}
          >
            <i className="fas fa-envelope"></i> Email Settings
          </button>
          <button
            onClick={() => setActiveTab('submission')}
            className={`tab-button ${activeTab === 'submission' ? 'active' : ''}`}
          >
            <i className="fas fa-file-upload"></i> Submission
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`tab-button ${activeTab === 'review' ? 'active' : ''}`}
          >
            <i className="fas fa-clipboard-check"></i> Review Process
          </button>
        </div>

        {/* Journal Information Tab */}
        {activeTab === 'journal' && (
          <Card className="settings-card">
            <h2>
              <i className="fas fa-book"></i> Journal Information
            </h2>
            <Formik
              initialValues={settings.journalInfo}
              enableReinitialize
              validationSchema={Yup.object({
                name: Yup.string().required('Journal name is required'),
                email: Yup.string().email('Invalid email').required('Email is required')
              })}
              onSubmit={(values) => handleSaveSettings(values, 'journalInfo')}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="settings-form">
                  <div className="form-group">
                    <label htmlFor="name">Journal Name *</label>
                    <Field
                      type="text"
                      name="name"
                      id="name"
                      className={`form-input ${errors.name && touched.name ? 'error' : ''}`}
                    />
                    {errors.name && touched.name && (
                      <div className="error-message">{errors.name}</div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="abbreviation">Abbreviation</label>
                      <Field
                        type="text"
                        name="abbreviation"
                        id="abbreviation"
                        placeholder="e.g., JPUST"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="issn">ISSN</label>
                      <Field
                        type="text"
                        name="issn"
                        id="issn"
                        placeholder="e.g., 1234-5678"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="publisher">Publisher</label>
                    <Field
                      type="text"
                      name="publisher"
                      id="publisher"
                      placeholder="Pundra University Press"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <Field
                      as="textarea"
                      name="description"
                      id="description"
                      rows="4"
                      className="form-textarea"
                      placeholder="Brief description of the journal..."
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="website">Website</label>
                      <Field
                        type="url"
                        name="website"
                        id="website"
                        placeholder="https://journal.pundra.edu"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Contact Email *</label>
                      <Field
                        type="email"
                        name="email"
                        id="email"
                        className={`form-input ${errors.email && touched.email ? 'error' : ''}`}
                      />
                      {errors.email && touched.email && (
                        <div className="error-message">{errors.email}</div>
                      )}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      <i className="fas fa-save"></i> {isSubmitting ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </Card>
        )}

        {/* Email Settings Tab */}
        {activeTab === 'email' && (
          <Card className="settings-card">
            <h2>
              <i className="fas fa-envelope"></i> Email Configuration
            </h2>
            <Formik
              initialValues={settings.emailSettings}
              enableReinitialize
              validationSchema={Yup.object({
                smtpHost: Yup.string().required('SMTP host is required'),
                smtpPort: Yup.number().required('SMTP port is required'),
                fromEmail: Yup.string().email('Invalid email').required('From email is required')
              })}
              onSubmit={(values) => handleSaveSettings(values, 'emailSettings')}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="settings-form">
                  <div className="info-box">
                    <i className="fas fa-info-circle"></i>
                    <p>Configure SMTP settings to enable automated email notifications (e.g., SendGrid, Mailgun, Gmail SMTP).</p>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="smtpHost">SMTP Host *</label>
                      <Field
                        type="text"
                        name="smtpHost"
                        id="smtpHost"
                        placeholder="smtp.example.com"
                        className={`form-input ${errors.smtpHost && touched.smtpHost ? 'error' : ''}`}
                      />
                      {errors.smtpHost && touched.smtpHost && (
                        <div className="error-message">{errors.smtpHost}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="smtpPort">SMTP Port *</label>
                      <Field
                        type="number"
                        name="smtpPort"
                        id="smtpPort"
                        className={`form-input ${errors.smtpPort && touched.smtpPort ? 'error' : ''}`}
                      />
                      {errors.smtpPort && touched.smtpPort && (
                        <div className="error-message">{errors.smtpPort}</div>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="smtpUser">SMTP Username</label>
                      <Field
                        type="text"
                        name="smtpUser"
                        id="smtpUser"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="smtpPassword">SMTP Password</label>
                      <Field
                        type="password"
                        name="smtpPassword"
                        id="smtpPassword"
                        placeholder="••••••••"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="fromEmail">From Email *</label>
                      <Field
                        type="email"
                        name="fromEmail"
                        id="fromEmail"
                        placeholder="journal@pundra.edu"
                        className={`form-input ${errors.fromEmail && touched.fromEmail ? 'error' : ''}`}
                      />
                      {errors.fromEmail && touched.fromEmail && (
                        <div className="error-message">{errors.fromEmail}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="fromName">From Name</label>
                      <Field
                        type="text"
                        name="fromName"
                        id="fromName"
                        placeholder="JPUST Editorial Office"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      <i className="fas fa-save"></i> {isSubmitting ? 'Saving...' : 'Save Settings'}
                    </button>
                    <button type="button" className="btn btn-outline">
                      <i className="fas fa-envelope"></i> Send Test Email
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </Card>
        )}

        {/* Submission Settings Tab */}
        {activeTab === 'submission' && (
          <Card className="settings-card">
            <h2>
              <i className="fas fa-file-upload"></i> Submission Settings
            </h2>
            <Formik
              initialValues={settings.submissionSettings}
              enableReinitialize
              onSubmit={(values) => handleSaveSettings(values, 'submissionSettings')}
            >
              {({ values, setFieldValue, isSubmitting }) => (
                <Form className="settings-form">
                  <div className="form-group">
                    <label className="checkbox-label-inline">
                      <Field type="checkbox" name="allowSubmissions" />
                      <span>Allow New Submissions</span>
                    </label>
                    <p className="field-hint">Uncheck to temporarily disable manuscript submissions</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="maxFileSize">Maximum File Size (MB)</label>
                    <Field
                      type="number"
                      name="maxFileSize"
                      id="maxFileSize"
                      min="1"
                      max="100"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Allowed File Types</label>
                    <div className="checkbox-group-inline">
                      <label className="checkbox-label">
                        <Field type="checkbox" name="allowedFileTypes" value=".pdf" />
                        <span>PDF</span>
                      </label>
                      <label className="checkbox-label">
                        <Field type="checkbox" name="allowedFileTypes" value=".docx" />
                        <span>DOCX</span>
                      </label>
                      <label className="checkbox-label">
                        <Field type="checkbox" name="allowedFileTypes" value=".doc" />
                        <span>DOC</span>
                      </label>
                      <label className="checkbox-label">
                        <Field type="checkbox" name="allowedFileTypes" value=".tex" />
                        <span>LaTeX</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label-inline">
                      <Field type="checkbox" name="requireORCID" />
                      <span>Require ORCID for Authors</span>
                    </label>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label-inline">
                      <Field type="checkbox" name="autoAssignManuscriptId" />
                      <span>Auto-assign Manuscript IDs</span>
                    </label>
                    <p className="field-hint">Automatically generate unique IDs for submitted manuscripts</p>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      <i className="fas fa-save"></i> {isSubmitting ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </Card>
        )}

        {/* Review Settings Tab */}
        {activeTab === 'review' && (
          <Card className="settings-card">
            <h2>
              <i className="fas fa-clipboard-check"></i> Review Process Settings
            </h2>
            <Formik
              initialValues={settings.reviewSettings}
              enableReinitialize
              onSubmit={(values) => handleSaveSettings(values, 'reviewSettings')}
            >
              {({ isSubmitting }) => (
                <Form className="settings-form">
                  <div className="form-group">
                    <label htmlFor="minReviewers">Minimum Number of Reviewers</label>
                    <Field
                      type="number"
                      name="minReviewers"
                      id="minReviewers"
                      min="1"
                      max="5"
                      className="form-input"
                    />
                    <p className="field-hint">Minimum reviewers required per manuscript</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reviewDeadlineDays">Default Review Deadline (Days)</label>
                    <Field
                      type="number"
                      name="reviewDeadlineDays"
                      id="reviewDeadlineDays"
                      min="7"
                      max="60"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="blindReviewType">Review Type</label>
                    <Field as="select" name="blindReviewType" id="blindReviewType" className="form-select">
                      <option value="double">Double-Blind (Recommended)</option>
                      <option value="single">Single-Blind</option>
                      <option value="open">Open Review</option>
                    </Field>
                    <p className="field-hint">
                      Double-Blind: Author and reviewer identities are hidden from each other
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label-inline">
                      <Field type="checkbox" name="sendReviewReminders" />
                      <span>Send Automatic Review Reminders</span>
                    </label>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reminderDays">Send Reminder (Days Before Deadline)</label>
                    <Field
                      type="number"
                      name="reminderDays"
                      id="reminderDays"
                      min="1"
                      max="14"
                      className="form-input"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      <i className="fas fa-save"></i> {isSubmitting ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default SystemSettings;