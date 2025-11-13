import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PublicLayout from '../../components/common/PublicLayout';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import Card from '../../components/common/Card';
import './CurrentIssue.css';

const CurrentIssue = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIssue, setCurrentIssue] = useState(null);

  useEffect(() => {
    fetchCurrentIssue();
  }, []);

  const fetchCurrentIssue = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/public/issues/current');
      setCurrentIssue(response.data);

    } catch (err) {
      console.error('Error fetching current issue:', err);
      setError(err.response?.data?.message || 'Failed to load current issue');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!currentIssue) {
    return (
      <PublicLayout>
        <div className="current-issue">
          <Card className="empty-state">
            <i className="fas fa-book-open empty-icon"></i>
            <h2>No Current Issue</h2>
            <p>There is no published issue at the moment. Please check back later.</p>
            <Link to="/archives" className="btn btn-primary">
              <i className="fas fa-archive"></i> View Archives
            </Link>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="current-issue">
        {/* Issue Header */}
        <div className="issue-header">
          <div className="issue-header-content">
            <h1>Current Issue</h1>
            <h2>Volume {currentIssue.volume}, Number {currentIssue.number} ({currentIssue.year})</h2>
            <h3>{currentIssue.title}</h3>
            <p className="publish-date">
              <i className="fas fa-calendar"></i>
              Published: {new Date(currentIssue.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          {currentIssue.coverImage && (
            <div className="issue-cover">
              <img src={currentIssue.coverImage} alt="Issue Cover" />
            </div>
          )}
        </div>

        {/* Issue Statistics */}
        <div className="issue-stats">
          <div className="stat-item">
            <i className="fas fa-file-alt"></i>
            <div>
              <strong>{currentIssue.manuscripts?.length || 0}</strong>
              <span>Articles</span>
            </div>
          </div>
          <div className="stat-item">
            <i className="fas fa-book"></i>
            <div>
              <strong>Vol. {currentIssue.volume}</strong>
              <span>Volume</span>
            </div>
          </div>
          <div className="stat-item">
            <i className="fas fa-hashtag"></i>
            <div>
              <strong>No. {currentIssue.number}</strong>
              <span>Issue Number</span>
            </div>
          </div>
          <div className="stat-item">
            <i className="fas fa-calendar-alt"></i>
            <div>
              <strong>{currentIssue.year}</strong>
              <span>Year</span>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        {currentIssue.manuscripts && currentIssue.manuscripts.length > 0 ? (
          <div className="table-of-contents">
            <h2 className="section-title">
              <i className="fas fa-list"></i> Table of Contents
            </h2>

            <div className="articles-list">
              {currentIssue.manuscripts.map((article, index) => (
                <Card key={article._id} className="article-item">
                  <div className="article-number">{index + 1}</div>
                  <div className="article-content">
                    <h3 className="article-title">
                      <Link to={`/article/${article._id}`}>
                        {article.title}
                      </Link>
                    </h3>
                    <p className="article-authors">
                      {article.authors?.map((author, idx) => (
                        <span key={idx}>
                          {author.firstName} {author.lastName}
                          {author.orcid && (
                            <a
                              href={`https://orcid.org/${author.orcid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="orcid-link"
                              title="ORCID"
                            >
                              <i className="fab fa-orcid"></i>
                            </a>
                          )}
                          {idx < article.authors.length - 1 && ', '}
                        </span>
                      ))}
                    </p>
                    {article.abstract && (
                      <p className="article-abstract">
                        {article.abstract.substring(0, 200)}...
                      </p>
                    )}
                    {article.keywords && article.keywords.length > 0 && (
                      <div className="article-keywords">
                        {article.keywords.slice(0, 5).map((keyword, idx) => (
                          <span key={idx} className="keyword-tag">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="article-meta">
                      {article.doi && (
                        <a
                          href={`https://doi.org/${article.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="doi-link"
                        >
                          <i className="fas fa-link"></i> DOI: {article.doi}
                        </a>
                      )}
                      <span className="pages">
                        Pages: {(index * 10) + 1}-{(index + 1) * 10}
                      </span>
                    </div>
                  </div>
                  <div className="article-actions">
                    <Link to={`/article/${article._id}`} className="btn btn-primary">
                      <i className="fas fa-file-pdf"></i> View Article
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="empty-state">
            <i className="fas fa-inbox empty-icon"></i>
            <h3>No Articles in This Issue</h3>
            <p>This issue is currently empty.</p>
          </Card>
        )}

        {/* Download Issue */}
        <Card className="download-section">
          <div className="download-content">
            <div className="download-info">
              <i className="fas fa-download"></i>
              <div>
                <h3>Download Complete Issue</h3>
                <p>Get all articles from this issue in a single PDF file</p>
              </div>
            </div>
            <button className="btn btn-success btn-lg">
              <i className="fas fa-file-pdf"></i> Download Full Issue (PDF)
            </button>
          </div>
        </Card>

        {/* Navigation */}
        <div className="issue-navigation">
          <Link to="/archives" className="btn btn-outline">
            <i className="fas fa-archive"></i> Browse All Issues
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
};

export default CurrentIssue;