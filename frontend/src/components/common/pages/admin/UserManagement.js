import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import './UserManagement.css';

const UserManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 15
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    role: searchParams.get('role') || 'all',
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      if (filters.role !== 'all') {
        params.role = filters.role;
      }

      if (filters.search) {
        params.search = filters.search;
      }

      const response = await api.get('/users', { params });

      setUsers(response.data.users || response.data);
      setPagination({
        ...pagination,
        totalPages: response.data.totalPages || 1,
        totalUsers: response.data.total || response.data.length,
        currentPage: response.data.currentPage || 1
      });

    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, currentPage: 1 });
    
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    setPagination({ ...pagination, currentPage: page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const userValidationSchema = Yup.object({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    affiliation: Yup.string(),
    roles: Yup.array().min(1, 'At least one role is required'),
    password: Yup.string().when('$isEdit', {
      is: false,
      then: (schema) => schema.min(6, 'Password must be at least 6 characters').required('Password is required'),
      otherwise: (schema) => schema.min(6, 'Password must be at least 6 characters')
    })
  });

  const handleCreateUser = async (values, { setSubmitting }) => {
    try {
      await api.post('/auth/register', values);
      alert('User created successfully!');
      setShowCreateModal(false);
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      alert(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (values, { setSubmitting }) => {
    try {
      const updateData = { ...values };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      await api.put(`/users/${selectedUser._id}`, updateData);
      alert('User updated successfully!');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      alert(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/users/${selectedUser._id}`);
      alert('User deleted successfully!');
      setShowDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  if (loading && users.length === 0) return <Loading />;

  return (
    <MainLayout>
      <div className="user-management">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>User Management</h1>
            <p className="page-description">
              Manage all system users and their roles
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <i className="fas fa-user-plus"></i> Add New User
          </button>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Filters Section */}
        <Card className="filters-card">
          <div className="filters-row">
            {/* Search */}
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-group">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </form>

            {/* Role Filter */}
            <div className="filter-group">
              <label htmlFor="role-filter">Filter by Role:</label>
              <select
                id="role-filter"
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="filter-select"
              >
                <option value="all">All Roles</option>
                <option value="author">Author</option>
                <option value="reviewer">Reviewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="filter-group">
              <label htmlFor="sort-filter">Sort By:</label>
              <select
                id="sort-filter"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="filter-select"
              >
                <option value="createdAt">Registration Date</option>
                <option value="lastName">Last Name</option>
                <option value="email">Email</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="filter-group">
              <label htmlFor="order-filter">Order:</label>
              <select
                id="order-filter"
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="filter-select"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        {users.length > 0 ? (
          <>
            <Card className="table-card">
              <div className="table-responsive">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Affiliation</th>
                      <th>Roles</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <div className="user-name-cell">
                            <div className="user-avatar-sm">
                              <i className="fas fa-user"></i>
                            </div>
                            <span>{user.firstName} {user.lastName}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.affiliation || '-'}</td>
                        <td>
                          <div className="roles-cell">
                            {user.roles.map((role, index) => (
                              <span key={index} className={`role-badge ${role}`}>
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="date-cell">
                            <i className="fas fa-calendar"></i>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              onClick={() => openEditModal(user)}
                              className="btn-icon"
                              title="Edit User"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => openDeleteDialog(user)}
                              className="btn-icon danger"
                              title="Delete User"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <Card className="empty-state">
            <i className="fas fa-users empty-icon"></i>
            <h3>No Users Found</h3>
            <p>
              {filters.role !== 'all' || filters.search
                ? 'Try adjusting your filters to see more results.'
                : 'No users in the system yet.'}
            </p>
            {(filters.role !== 'all' || filters.search) && (
              <button
                onClick={() => {
                  setFilters({ role: 'all', search: '', sortBy: 'createdAt', sortOrder: 'desc' });
                  setSearchParams({});
                }}
                className="btn btn-outline"
              >
                Clear Filters
              </button>
            )}
          </Card>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <Modal
            title="Create New User"
            onClose={() => setShowCreateModal(false)}
          >
            <UserForm
              onSubmit={handleCreateUser}
              onCancel={() => setShowCreateModal(false)}
              isEdit={false}
            />
          </Modal>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <Modal
            title="Edit User"
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
          >
            <UserForm
              initialValues={selectedUser}
              onSubmit={handleUpdateUser}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedUser(null);
              }}
              isEdit={true}
            />
          </Modal>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && selectedUser && (
          <ConfirmDialog
            title="Delete User"
            message={`Are you sure you want to delete ${selectedUser.firstName} ${selectedUser.lastName}? This action cannot be undone.`}
            confirmText="Delete"
            confirmVariant="danger"
            onConfirm={handleDeleteUser}
            onCancel={() => {
              setShowDeleteDialog(false);
              setSelectedUser(null);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

// User Form Component
const UserForm = ({ initialValues, onSubmit, onCancel, isEdit }) => {
  const defaultValues = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    affiliation: '',
    roles: ['author']
  };

  const formValues = initialValues ? {
    ...initialValues,
    password: ''
  } : defaultValues;

  const userValidationSchema = Yup.object({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    affiliation: Yup.string(),
    roles: Yup.array().min(1, 'At least one role is required'),
    password: isEdit 
      ? Yup.string().min(6, 'Password must be at least 6 characters')
      : Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
  });

  return (
    <Formik
      initialValues={formValues}
      validationSchema={userValidationSchema}
      onSubmit={onSubmit}
    >
      {({ values, errors, touched, setFieldValue, isSubmitting }) => (
        <Form className="user-form">
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
              disabled={isEdit}
              className={`form-input ${errors.email && touched.email ? 'error' : ''}`}
            />
            {errors.email && touched.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password {isEdit ? '(leave blank to keep current)' : '*'}
            </label>
            <Field
              type="password"
              name="password"
              id="password"
              placeholder={isEdit ? 'Leave blank to keep current password' : ''}
              className={`form-input ${errors.password && touched.password ? 'error' : ''}`}
            />
            {errors.password && touched.password && (
              <div className="error-message">{errors.password}</div>
            )}
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

          <div className="form-group">
            <label>Roles * (Select at least one)</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <Field
                  type="checkbox"
                  name="roles"
                  value="author"
                />
                <span>Author</span>
              </label>
              <label className="checkbox-label">
                <Field
                  type="checkbox"
                  name="roles"
                  value="reviewer"
                />
                <span>Reviewer</span>
              </label>
              <label className="checkbox-label">
                <Field
                  type="checkbox"
                  name="roles"
                  value="editor"
                />
                <span>Editor</span>
              </label>
              <label className="checkbox-label">
                <Field
                  type="checkbox"
                  name="roles"
                  value="admin"
                />
                <span>Admin</span>
              </label>
            </div>
            {errors.roles && touched.roles && (
              <div className="error-message">{errors.roles}</div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onCancel}
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
              {isSubmitting ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default UserManagement;