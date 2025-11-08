import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import MainLayout from '../../components/common/MainLayout';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import Card from '../../components/common/Card';
import './Analytics.css';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    submissionStats: {
      total: 0,
      byStatus: {},
      byMonth: []
    },
    reviewStats: {
      total: 0,
      completed: 0,
      pending: 0,
      averageTime: 0
    },
    userStats: {
      total: 0,
      byRole: {},
      recentRegistrations: []
    },
    publicationStats: {
      totalIssues: 0,
      totalArticles: 0,
      acceptanceRate: 0,
      averageTimeToPublication: 0
    }
  });

  const [timeRange, setTimeRange] = useState('all'); // all, year, month

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/admin/analytics', {
        params: { timeRange }
      });

      setAnalytics(response.data);

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(1);
  };

  if (loading) return <Loading />;

  return (
    <MainLayout>
      <div className="analytics">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Analytics & Reports</h1>
            <p className="page-description">
              Comprehensive insights into system usage and performance
            </p>
          </div>
          <div className="time-range-selector">
            <label>Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-select"
            >
              <option value="all">All Time</option>
              <option value="year">This Year</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Submission Analytics */}
        <div className="analytics-section">
          <h2 className="section-title">
            <i className="fas fa-file-alt"></i> Submission Analytics
          </h2>

          <div className="stats-grid">
            <Card className="stat-card">
              <h3>Total Submissions</h3>
              <div className="big-number">{analytics.submissionStats.total}</div>
            </Card>

            {Object.entries(analytics.submissionStats.byStatus || {}).map(([status, count]) => (
              <Card key={status} className="stat-card">
                <h3>{status.replace('_', ' ').toUpperCase()}</h3>
                <div className="big-number">{count}</div>
                <div className="percentage">
                  {calculatePercentage(count, analytics.submissionStats.total)}% of total
                </div>
              </Card>
            ))}
          </div>

          {/* Submission Trend Chart */}
          {analytics.submissionStats.byMonth && analytics.submissionStats.byMonth.length > 0 && (
            <Card className="chart-card">
              <h3>Submission Trend</h3>
              <div className="bar-chart">
                {analytics.submissionStats.byMonth.map((item, index) => {
                  const maxValue = Math.max(...analytics.submissionStats.byMonth.map(i => i.count));
                  const height = (item.count / maxValue) * 100;
                  
                  return (
                    <div key={index} className="bar-item">
                      <div className="bar-container">
                        <div
                          className="bar"
                          style={{ height: `${height}%` }}
                          title={`${item.count} submissions`}
                        >
                          <span className="bar-value">{item.count}</span>
                        </div>
                      </div>
                      <div className="bar-label">{item.month}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Review Analytics */}
        <div className="analytics-section">
          <h2 className="section-title">
            <i className="fas fa-clipboard-check"></i> Review Analytics
          </h2>

          <div className="stats-grid">
            <Card className="stat-card">
              <h3>Total Reviews</h3>
              <div className="big-number">{analytics.reviewStats.total}</div>
            </Card>

            <Card className="stat-card">
              <h3>Completed Reviews</h3>
              <div className="big-number">{analytics.reviewStats.completed}</div>
              <div className="percentage">
                {calculatePercentage(analytics.reviewStats.completed, analytics.reviewStats.total)}% completion rate
              </div>
            </Card>

            <Card className="stat-card">
              <h3>Pending Reviews</h3>
              <div className="big-number">{analytics.reviewStats.pending}</div>
            </Card>

            <Card className="stat-card">
              <h3>Avg. Review Time</h3>
              <div className="big-number">{analytics.reviewStats.averageTime || 0}</div>
              <div className="percentage">days</div>
            </Card>
          </div>

          {/* Review Completion Progress */}
          <Card className="progress-card">
            <h3>Review Completion Rate</h3>
            <div className="progress-bar-large">
              <div
                className="progress-fill"
                style={{ width: `${calculatePercentage(analytics.reviewStats.completed, analytics.reviewStats.total)}%` }}
              >
                <span className="progress-label">
                  {calculatePercentage(analytics.reviewStats.completed, analytics.reviewStats.total)}%
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* User Analytics */}
        <div className="analytics-section">
          <h2 className="section-title">
            <i className="fas fa-users"></i> User Analytics
          </h2>

          <div className="stats-grid">
            <Card className="stat-card">
              <h3>Total Users</h3>
              <div className="big-number">{analytics.userStats.total}</div>
            </Card>

            {Object.entries(analytics.userStats.byRole || {}).map(([role, count]) => (
              <Card key={role} className="stat-card">
                <h3>{role.toUpperCase()}S</h3>
                <div className="big-number">{count}</div>
                <div className="percentage">
                  {calculatePercentage(count, analytics.userStats.total)}% of users
                </div>
              </Card>
            ))}
          </div>

          {/* User Distribution Pie Chart */}
          <Card className="chart-card">
            <h3>User Distribution by Role</h3>
            <div className="pie-chart-legend">
              {Object.entries(analytics.userStats.byRole || {}).map(([role, count]) => (
                <div key={role} className="legend-item">
                  <span className={`legend-color role-${role}`}></span>
                  <span className="legend-label">{role}: {count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Publication Analytics */}
        <div className="analytics-section">
          <h2 className="section-title">
            <i className="fas fa-book"></i> Publication Analytics
          </h2>

          <div className="stats-grid">
            <Card className="stat-card">
              <h3>Published Issues</h3>
              <div className="big-number">{analytics.publicationStats.totalIssues}</div>
            </Card>

            <Card className="stat-card">
              <h3>Published Articles</h3>
              <div className="big-number">{analytics.publicationStats.totalArticles}</div>
            </Card>

            <Card className="stat-card highlight">
              <h3>Acceptance Rate</h3>
              <div className="big-number">{analytics.publicationStats.acceptanceRate}%</div>
              <div className="percentage">of submitted papers</div>
            </Card>

            <Card className="stat-card">
              <h3>Avg. Time to Publication</h3>
              <div className="big-number">{analytics.publicationStats.averageTimeToPublication || 0}</div>
              <div className="percentage">days</div>
            </Card>
          </div>
        </div>

        {/* Export Options */}
        <Card className="export-card">
          <h3>
            <i className="fas fa-download"></i> Export Reports
          </h3>
          <p>Download analytics data in various formats</p>
          <div className="export-buttons">
            <button className="btn btn-outline">
              <i className="fas fa-file-csv"></i> Export as CSV
            </button>
            <button className="btn btn-outline">
              <i className="fas fa-file-pdf"></i> Export as PDF
            </button>
            <button className="btn btn-outline">
              <i className="fas fa-file-excel"></i> Export as Excel
            </button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Analytics;