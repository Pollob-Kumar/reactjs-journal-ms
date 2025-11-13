import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PublicLayout from '../../components/common/PublicLayout.jsx';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Card from '../../components/common/Card.jsx';
import './Archives.css';

const Archives = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [issues, setIssues] = useState([]);
  const [groupedIssues, setGroupedIssues] = useState({});
  const [expandedVolumes, setExpandedVolumes] = useState({});

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/public/issues');
      const issuesData = response.data;
      setIssues(issuesData);

      // Group issues by volume
      const grouped = issuesData.reduce((acc, issue) => {
        const volume = issue.volume;
        if (!acc[volume]) {
          acc[volume] = [];
        }
        acc[volume].push(issue);
        return acc;
      }, {});

      // Sort issues within each volume by number (descending)
      Object.keys(grouped).forEach(volume => {
        grouped[volume].sort((a, b) => b.number - a.number);
      });

      setGroupedIssues(grouped);

      // Expand the first volume by default
      if (Object.keys(grouped).length > 0) {
        const latestVolume = Math.max(...Object.keys(grouped).map(Number));
        setExpandedVolumes({ [latestVolume]: true });
      }

    } catch (err) {
      console.error('Error fetching archives:', err);
      setError(err.response?.data?.message || 'Failed to load archives');
    } finally {
      setLoading(false);
    }
  };

  const toggleVolume = (volume) => {
    setExpandedVolumes({
      ...expandedVolumes,
      [volume]: !expandedVolumes[volume]
    });
  };

  if (loading) return <Loading />;

  return (
    <PublicLayout>
      <div className="archives">
        {/* Archives Header */}
        <div className="archives-header">
          <h1>Journal Archives</h1>
          <p>Browse all published volumes and issues</p>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Archives Statistics */}
        <div className="archives-stats">
          <div className="stat-box">
            <i className="fas fa-book"></i>
            <div>
              <strong>{Object.keys(groupedIssues).length}</strong>
              <span>Volumes</span>
            </div>
          </div>
          <div className="stat-box">
            <i className="fas fa-newspaper"></i>
            <div>
              <strong>{issues.length}</strong>
              <span>Issues</span>
            </div>
          </div>
          <div className="stat-box">
            <i className="fas fa-file-alt"></i>
            <div>
              <strong>{issues.reduce((sum, issue) => sum + (issue.manuscripts?.length || 0), 0)}</strong>
              <span>Articles</span>
            </div>
          </div>
        </div>

        {/* Volumes List */}
        {Object.keys(groupedIssues).length > 0 ? (
          <div className="volumes-list">
            {Object.keys(groupedIssues)
              .sort((a, b) => Number(b) - Number(a)) // Sort volumes descending
              .map((volume) => (
                <Card key={volume} className="volume-card">
                  <div
                    className="volume-header"
                    onClick={() => toggleVolume(volume)}
                  >
                    <div className="volume-info">
                      <h2>Volume {volume}</h2>
                      <span className="issue-count">
                        {groupedIssues[volume].length} Issue{groupedIssues[volume].length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <button className="expand-button">
                      <i className={`fas fa-chevron-${expandedVolumes[volume] ? 'up' : 'down'}`}></i>
                    </button>
                  </div>

                  {expandedVolumes[volume] && (
                    <div className="issues-grid">
                      {groupedIssues[volume].map((issue) => (
                        <div key={issue._id} className="issue-card">
                          {issue.coverImage ? (
                            <div className="issue-cover">
                              <img src={issue.coverImage} alt={`Volume ${issue.volume} Issue ${issue.number}`} />
                            </div>
                          ) : (
                            <div className="issue-cover-placeholder">
                              <i className="fas fa-book-open"></i>
                              <p>Vol. {issue.volume}</p>
                              <p>No. {issue.number}</p>
                            </div>
                          )}

                          <div className="issue-details">
                            <h3>Issue {issue.number} ({issue.year})</h3>
                            <h4>{issue.title}</h4>
                            <p className="issue-meta">
                              <i className="fas fa-calendar"></i>
                              {new Date(issue.publishedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long'
                              })}
                            </p>
                            <p className="issue-meta">
                              <i className="fas fa-file-alt"></i>
                              {issue.manuscripts?.length || 0} Articles
                            </p>

                            <Link to={`/issue/${issue._id}`} className="btn btn-primary btn-sm">
                              <i className="fas fa-eye"></i> View Issue
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
          </div>
        ) : (
          <Card className="empty-state">
            <i className="fas fa-archive empty-icon"></i>
            <h3>No Archives Available</h3>
            <p>There are no published issues in the archive yet.</p>
            <Link to="/" className="btn btn-primary">
              <i className="fas fa-home"></i> Go to Home
            </Link>
          </Card>
        )}
      </div>
    </PublicLayout>
  );
};

export default Archives;