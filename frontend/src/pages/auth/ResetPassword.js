import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FaLock, FaCheck } from 'react-icons/fa';
import './Auth.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: ''
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        )
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required')
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await api.put(`/auth/reset-password/${token}`, {
          password: values.password
        });
        toast.success('Password reset successful! You can now login.');
        navigate('/login');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to reset password');
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your new password</p>
        </div>

        <form onSubmit={formik.handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <FaLock /> New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={`form-control ${formik.touched.password && formik.errors.password ? 'error' : ''}`}
              placeholder="Enter new password"
              {...formik.getFieldProps('password')}
            />
            {formik.touched.password && formik.errors.password && (
              <div className="form-error">{formik.errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              <FaLock /> Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={`form-control ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm new password"
              {...formik.getFieldProps('confirmPassword')}
            />
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <div className="form-error">{formik.errors.confirmPassword}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div> Resetting...
              </>
            ) : (
              <>
                <FaCheck /> Reset Password
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p><Link to="/login">Back to Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;