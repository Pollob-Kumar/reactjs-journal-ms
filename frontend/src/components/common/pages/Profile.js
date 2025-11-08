import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MainLayout from '../components/common/MainLayout';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'

  const profileValidationSchema = Yup.object({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    affiliation: Yup.string()
  });

  const passwordValidationSchema = Yup.object({
    currentPassword: Yup.string().required('Current password is required'),
    newPassword: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('New password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
      .required('Please confirm your password')
  });

  const handleUpdateProfile = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await api.put('/users/profile', values);
      
      // Update user context
      updateUser(response.data);
      
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (values, { setSubmitting, resetForm }) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await api.put('/users/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });

      setSuccess('Password changed successfully!');
      resetForm();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  if (!user) return <Loading />;

  return (
    <MainLayout>
      <div className="profile-page">
        {/* Page Header */}
        <div className="page-header">
          <h1>My Profile</h1>
          <p className="page-description">Manage your account settings and preferences</p>
        </div>

        {error && <ErrorMessage message={error} />}
        {success && (
          <div className="success-message">
            <i className="fas fa-check-circle"></i> {success}
          </div>
        )}

        {/* Profile Tabs */}
        <div className="profile-tabs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <i className="fas fa-user"></i> Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
          >
            <i className="fas fa-lock"></i> Change Password
          </button>
        </div>

        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <Card className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                <i className="fas fa-user-circle"></i>
              </div>
              <div className="profile-info">
                <h2>{user.firstName} {user.lastName}</h2>
                <p>{user.email}</p>
                <div className="user-roles">
                  {user.roles && user.roles.map((role, index) => (
                    <span key={index} className={`role-badge ${role}`}>
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Formik
              initialValues={{
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                affiliation: user.affiliation || ''
              }}
              validationSchema={profileValidationSchema}
              onSubmit={handleUpdateProfile}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name *</label>
                      <Field
                        type="text"
                        name="firstName"
                        id="firstName"
                        className={`form-input ${errors.firstName && touched.firstName ? 'error' : ''}`}
                      />
                      {errors.firstName && touched.firstName && (
                        <div className="error-message">{errors.firstName}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="lastName">Last Name *</label>
                      <Field
                        type="text"
                        name="lastName"
                        id="lastName"
                        className={`form-input ${errors.lastName && touched.lastName ? 'error' : ''}`}
                      />
                      {errors.lastName && touched.lastName && (
                        <div className="error-message">{errors.lastName}</div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <Field
                      type="email"
                      name="email"
                      id="email"
                      disabled
                      className="form-input"
                    />
                    <p className="field-hint">Email cannot be changed</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="affiliation">Affiliation</label>
                    <Field
                      type="text"
                      name="affiliation"
                      id="affiliation"
                      placeholder="University or Organization"
                      className="form-input"
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting || loading}
                    >
                      {isSubmitting || loading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save"></i> Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </Card>
        )}

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <Card className="profile-card">
            <h2>
              <i className="fas fa-lock"></i> Change Password
            </h2>
            <p className="section-description">
              Ensure your account is secure by using a strong password
            </p>

            <Formik
              initialValues={{
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              }}
              validationSchema={passwordValidationSchema}
              onSubmit={handleChangePassword}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="password-form">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password *</label>
                    <Field
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      className={`form-input ${errors.currentPassword && touched.currentPassword ? 'error' : ''}`}
                    />
                    {errors.currentPassword && touched.currentPassword && (
                      <div className="error-message">{errors.currentPassword}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password *</label>
                    <Field
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      className={`form-input ${errors.newPassword && touched.newPassword ? 'error' : ''}`}
                    />
                    {errors.newPassword && touched.newPassword && (
                      <div className="error-message">{errors.newPassword}</div>
                    )}
                    <p className="field-hint">Must be at least 6 characters</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password *</label>
                    <Field
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      className={`form-input ${errors.confirmPassword && touched.confirmPassword ? 'error' : ''}`}
                    />
                    {errors.confirmPassword && touched.confirmPassword && (
                      <div className="error-message">{errors.confirmPassword}</div>
                    )}
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting || loading}
                    >
                      {isSubmitting || loading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Changing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-key"></i> Change Password
                        </>
                      )}
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

export default Profile;