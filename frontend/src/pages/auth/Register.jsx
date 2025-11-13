import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext.jsx';
import { FaUser, FaEnvelope, FaLock, FaUniversity, FaUserPlus } from 'react-icons/fa';
import './Auth.css';

const Register = () => {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      affiliation: '',
      roles: ['author'],
      expertise: [],
      orcid: ''
    },
    validationSchema: Yup.object({
      firstName: Yup.string()
        .max(50, 'Must be 50 characters or less')
        .required('First name is required'),
      lastName: Yup.string()
        .max(50, 'Must be 50 characters or less')
        .required('Last name is required'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        )
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required'),
      affiliation: Yup.string()
        .max(200, 'Must be 200 characters or less')
        .required('Affiliation is required'),
      orcid: Yup.string()
        .matches(/^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/, 'Invalid ORCID format (e.g., 0000-0002-1825-0097)')
        .nullable()
    }),
    onSubmit: async (values) => {
      setLoading(true);
      const { confirmPassword, ...userData } = values;
      await register(userData);
      setLoading(false);
    }
  });

  const handleRoleChange = (role) => {
    const currentRoles = formik.values.roles;
    if (currentRoles.includes(role)) {
      formik.setFieldValue('roles', currentRoles.filter(r => r !== role));
    } else {
      formik.setFieldValue('roles', [...currentRoles, role]);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Register for PUJMS</p>
        </div>

        <form onSubmit={formik.handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                <FaUser /> First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className={`form-control ${formik.touched.firstName && formik.errors.firstName ? 'error' : ''}`}
                placeholder="John"
                {...formik.getFieldProps('firstName')}
              />
              {formik.touched.firstName && formik.errors.firstName && (
                <div className="form-error">{formik.errors.firstName}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                <FaUser /> Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className={`form-control ${formik.touched.lastName && formik.errors.lastName ? 'error' : ''}`}
                placeholder="Doe"
                {...formik.getFieldProps('lastName')}
              />
              {formik.touched.lastName && formik.errors.lastName && (
                <div className="form-error">{formik.errors.lastName}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <FaEnvelope /> Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-control ${formik.touched.email && formik.errors.email ? 'error' : ''}`}
              placeholder="john.doe@example.com"
              {...formik.getFieldProps('email')}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="form-error">{formik.errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="affiliation" className="form-label">
              <FaUniversity /> Affiliation *
            </label>
            <input
              type="text"
              id="affiliation"
              name="affiliation"
              className={`form-control ${formik.touched.affiliation && formik.errors.affiliation ? 'error' : ''}`}
              placeholder="Pundra University"
              {...formik.getFieldProps('affiliation')}
            />
            {formik.touched.affiliation && formik.errors.affiliation && (
              <div className="form-error">{formik.errors.affiliation}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="orcid" className="form-label">
              ORCID (Optional)
            </label>
            <input
              type="text"
              id="orcid"
              name="orcid"
              className={`form-control ${formik.touched.orcid && formik.errors.orcid ? 'error' : ''}`}
              placeholder="0000-0002-1825-0097"
              {...formik.getFieldProps('orcid')}
            />
            {formik.touched.orcid && formik.errors.orcid && (
              <div className="form-error">{formik.errors.orcid}</div>
            )}
            <small className="form-help">
              Format: 0000-0002-1825-0097
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <FaLock /> Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-control ${formik.touched.password && formik.errors.password ? 'error' : ''}`}
                placeholder="Enter password"
                {...formik.getFieldProps('password')}
              />
              {formik.touched.password && formik.errors.password && (
                <div className="form-error">{formik.errors.password}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                <FaLock /> Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`form-control ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm password"
                {...formik.getFieldProps('confirmPassword')}
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <div className="form-error">{formik.errors.confirmPassword}</div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Register as *</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formik.values.roles.includes('author')}
                  onChange={() => handleRoleChange('author')}
                />
                <span>Author</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formik.values.roles.includes('reviewer')}
                  onChange={() => handleRoleChange('reviewer')}
                />
                <span>Reviewer</span>
              </label>
            </div>
            <small className="form-help">
              You can select multiple roles. Editor and Admin roles are assigned by administrators.
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || formik.values.roles.length === 0}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div> Creating Account...
              </>
            ) : (
              <>
                <FaUserPlus /> Register
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
          <p><Link to="/">Back to Home</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;