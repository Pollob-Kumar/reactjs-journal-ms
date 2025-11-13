import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext.jsx';
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .required('Password is required')
    }),
    onSubmit: async (values) => {
      setLoading(true);
      await login(values.email, values.password);
      setLoading(false);
    }
  });

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your PUJMS account</p>
        </div>

        <form onSubmit={formik.handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <FaEnvelope /> Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-control ${formik.touched.email && formik.errors.email ? 'error' : ''}`}
              placeholder="Enter your email"
              {...formik.getFieldProps('email')}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="form-error">{formik.errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <FaLock /> Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={`form-control ${formik.touched.password && formik.errors.password ? 'error' : ''}`}
              placeholder="Enter your password"
              {...formik.getFieldProps('password')}
            />
            {formik.touched.password && formik.errors.password && (
              <div className="form-error">{formik.errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <Link to="/forgot-password" className="forgot-link">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div> Signing in...
              </>
            ) : (
              <>
                <FaSignInAlt /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
          <p><Link to="/">Back to Home</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;