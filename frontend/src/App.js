import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import PublicRoute from './components/common/PublicRoute';

// Layout
import MainLayout from './components/common/MainLayout';
import PublicLayout from './components/common/PublicLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Author Pages
import AuthorDashboard from './pages/author/Dashboard';
import SubmitManuscript from './pages/author/SubmitManuscript';
import MySubmissions from './pages/author/MySubmissions';
import ManuscriptDetail from './pages/author/ManuscriptDetail';
import SubmitRevision from './pages/author/SubmitRevision';

// Reviewer Pages
import ReviewerDashboard from './pages/reviewer/Dashboard';
import MyReviews from './pages/reviewer/MyReviews';
import ReviewDetail from './pages/reviewer/ReviewDetail';
import SubmitReview from './pages/reviewer/SubmitReview';

// Editor Pages
import EditorDashboard from './pages/editor/Dashboard';
import ManageSubmissions from './pages/editor/ManageSubmissions';
import AssignReviewers from './pages/editor/AssignReviewers';
import ManageReviews from './pages/editor/ManageReviews';
import MakeDecision from './pages/editor/MakeDecision';
import ManageIssues from './pages/editor/ManageIssues';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import SubmissionManagement from './pages/admin/SubmissionManagement';
import SystemSettings from './pages/admin/SystemSettings';
import Analytics from './pages/admin/Analytics';
import RevisionHistory from './components/common/pages/admin/RevisionHistory';

// Public Pages
import Home from './pages/public/Home';
import Search from './pages/public/Search';
import CurrentIssue from './pages/public/CurrentIssue';
import Archives from './pages/public/Archives';
import ArticleView from './pages/public/ArticleView';
import About from './pages/public/About';
import DoiDeposits from './components/common/pages/admin/DoiDeposits';
import ArticleView from './components/common/pages/public/ArticleView';

// Profile
import Profile from './pages/Profile';

// Not Found
import NotFound from './pages/NotFound';

import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/current-issue" element={<CurrentIssue />} />
                <Route path="/archives" element={<Archives />} />
                <Route path="/article/:manuscriptId" element={<ArticleView />} />
                <Route path="/about" element={<About />} />
                  // In the public routes section:
                <Route path="/articles/:articleId" element={<ArticleView />} />
                <Route path="/articles/doi/:doi" element={<ArticleView />} /> {/* Add DOI route */}
              </Route>

              {/* Auth Routes */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
              </Route>

              {/* Protected Routes */}
              <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
                {/* Profile */}
                <Route path="/profile" element={<Profile />} />

                {/* Author Routes */}
                <Route path="/author/dashboard" element={<PrivateRoute roles={['author']}><AuthorDashboard /></PrivateRoute>} />
                <Route path="/author/submit" element={<PrivateRoute roles={['author']}><SubmitManuscript /></PrivateRoute>} />
                <Route path="/author/submissions" element={<PrivateRoute roles={['author']}><MySubmissions /></PrivateRoute>} />
                <Route path="/author/manuscript/:id" element={<PrivateRoute roles={['author']}><ManuscriptDetail /></PrivateRoute>} />
                <Route path="/author/manuscript/:id/revise" element={<PrivateRoute roles={['author']}><SubmitRevision /></PrivateRoute>} />

                {/* Reviewer Routes */}
                <Route path="/reviewer/dashboard" element={<PrivateRoute roles={['reviewer']}><ReviewerDashboard /></PrivateRoute>} />
                <Route path="/reviewer/reviews" element={<PrivateRoute roles={['reviewer']}><MyReviews /></PrivateRoute>} />
                <Route path="/reviewer/review/:id" element={<PrivateRoute roles={['reviewer']}><ReviewDetail /></PrivateRoute>} />
                <Route path="/reviewer/review/:id/submit" element={<PrivateRoute roles={['reviewer']}><SubmitReview /></PrivateRoute>} />

                {/* Editor Routes */}
                <Route path="/editor/dashboard" element={<PrivateRoute roles={['editor']}><EditorDashboard /></PrivateRoute>} />
                <Route path="/editor/submissions" element={<PrivateRoute roles={['editor']}><ManageSubmissions /></PrivateRoute>} />
                <Route path="/editor/manuscript/:id/assign" element={<PrivateRoute roles={['editor']}><AssignReviewers /></PrivateRoute>} />
                <Route path="/editor/manuscript/:id/reviews" element={<PrivateRoute roles={['editor']}><ManageReviews /></PrivateRoute>} />
                <Route path="/editor/manuscript/:id/decision" element={<PrivateRoute roles={['editor']}><MakeDecision /></PrivateRoute>} />
                <Route path="/editor/issues" element={<PrivateRoute roles={['editor']}><ManageIssues /></PrivateRoute>} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
                <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><UserManagement /></PrivateRoute>} />
                <Route path="/admin/submissions" element={<PrivateRoute roles={['admin']}><SubmissionManagement /></PrivateRoute>} />
                <Route path="/admin/settings" element={<PrivateRoute roles={['admin']}><SystemSettings /></PrivateRoute>} />
                <Route path="/admin/analytics" element={<PrivateRoute roles={['admin']}><Analytics /></PrivateRoute>} />
                  // ... inside Routes component, in the admin section:
                <Route path="/admin/manuscripts/:manuscriptId/revisions" element={<PrivateRoute roles={['admin']}><RevisionHistory /></PrivateRoute>} />
                  // In admin routes section:
                <Route path="/admin/doi/deposits" element={<PrivateRoute roles={['admin']}><DoiDeposits /></PrivateRoute>} />
              </Route>

              {/* 404 */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>

            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
