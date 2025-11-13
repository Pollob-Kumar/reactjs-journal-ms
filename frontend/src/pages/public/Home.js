import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PublicLayout from '../../components/common/PublicLayout';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import Card from '../../components/common/Card';
import './Home.css';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIssue, setCurrentIssue] = useState(null);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [statistics, setStatistics] = useState({
    totalArticles: 0,
    totalIssues: 0,
    totalAuthors: 0
  });

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current issue
      const currentIssueResponse = await api.get('/public/issues/current');
      setCurrentIssue(currentIssueResponse.data);

      // Fetch featured/recent articles
      const articlesResponse = await api.get('/public/articles?limit=6&sortBy=publishedAt&sortOrder=desc');
      setFeaturedArticles(articlesResponse.data.articles || articlesResponse.data);

      // Fetch statistics
      const statsResponse = await api.get('/public/statistics');
      setStatistics(statsResponse.data);

    } catch (err) {
      console.error('Error fetching home data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <PublicLayout>
      <div className="home">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <h1>Journal of Pundra University of Science & Technology</h1>
            <p className="hero-subtitle">
              Advancing Scientific Knowledge Through Quality Research
            </p>
            <p className="hero-description">
              A peer-reviewed, open-access journal publishing original research in Science, Technology, Engineering, and Mathematics.
            </p>
            <div className="hero-actions">
              <Link to="/search" className="btn btn-primary btn-lg">
                <i className="fas fa-search"></i> Browse Articles
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                <i className="fas fa-upload"></i> Submit Manuscript
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <i className="fas fa-graduation-cap"></i>
          </div>
        </section>

        {error && <ErrorMessage message={error} />}

        {/* Statistics Section */}
        <section className="statistics-section">
          <div className="stats-container">
            <div className="stat-box">
              <div className="stat-icon">
                <i className="fas fa-file-alt"></i>
              </div>
              <div className="stat-content">
                <h3>{statistics.totalArticles}</h3>
                <p>Published Articles</p>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">
                <i className="fas fa-book"></i>
              </div>
              <div className="stat-content">
                <h3>{statistics.totalIssues}</h3>
                <p>Journal Issues</p>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h3>{statistics.totalAuthors}</h3>
                <p>Contributing Authors</p>
              </div>
            </div>
          </div>
        </section>

        {/* Current Issue Section */}
        {currentIssue && (
          <section className="current-issue-section">
            <div className="section-header">
              <h2>Current Issue</h2>
              <Link to="/current-issue" className="view-all-link">
                View Full Issue <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
            <Card className="current-issue-card">
              <div className="issue-info">
                <div className="issue-cover">
                  {currentIssue.coverImage ? (
                    <img src={currentIssue.coverImage} alt="Issue Cover" />
                  ) : (
                    <div className="default-cover">
                      <i className="fas fa-book-open"></i>
                      <p>Volume {currentIssue.volume}</p>
                      <p>Issue {currentIssue.number}</p>
                    </div>
                  )}
                </div>
                <div className="issue-details">
                  <h3>Volume {currentIssue.volume}, Number {currentIssue.number} ({currentIssue.year})</h3>
                  <h4>{currentIssue.title}</h4>
                  <p className="issue-meta">
                    <i className="fas fa-calendar"></i>
                    Published: {new Date(currentIssue.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="issue-meta">
                    <i className="fas fa-file-alt"></i>
                    {currentIssue.manuscripts?.length || 0} Articles
                  </p>
                  <Link to="/current-issue" className="btn btn-primary">
                    <i className="fas fa-eye"></i> View Issue
                  </Link>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Featured Articles Section */}
        <section className="featured-articles-section">
          <div className="section-header">
            <h2>Recent Publications</h2>
            <Link to="/search" className="view-all-link">
              View All Articles <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          <div className="articles-grid">
            {featuredArticles.map((article) => (
              <Card key={article._id} className="article-card">
                <div className="article-meta-top">
                  <span className="article-type">Research Article</span>
                  {article.doi && (
                    <span className="doi-badge">
                      <i className="fas fa-link"></i> DOI
                    </span>
                  )}
                </div>
                <h3 className="article-title">
                  <Link to={`/article/${article._id}`}>
                    {article.title}
                  </Link>
                </h3>
                <p className="article-authors">
                  {article.authors?.slice(0, 3).map((author, index) => (
                    <span key={index}>
                      {author.firstName} {author.lastName}
                      {index < Math.min(2, article.authors.length - 1) && ', '}
                    </span>
                  ))}
                  {article.authors?.length > 3 && ' et al.'}
                </p>
                <p className="article-abstract">
                  {article.abstract?.substring(0, 150)}...
                </p>
                <div className="article-keywords">
                  {article.keywords?.slice(0, 3).map((keyword, index) => (
                    <span key={index} className="keyword-tag">
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="article-footer">
                  <span className="publish-date">
                    <i className="fas fa-calendar"></i>
                    {new Date(article.publishedAt || article.submittedAt).toLocaleDateString()}
                  </span>
                  <Link to={`/article/${article._id}`} className="read-more">
                    Read More <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="cta-section">
          <Card className="cta-card">
            <div className="cta-content">
              <h2>Submit Your Research</h2>
              <p>
                Join our community of researchers and share your findings with the world. 
                Our rigorous peer-review process ensures the highest quality publications.
              </p>
              <div className="cta-features">
                <div className="feature">
                  <i className="fas fa-check-circle"></i>
                  <span>Fast Peer Review</span>
                </div>
                <div className="feature">
                  <i className="fas fa-check-circle"></i>
                  <span>Open Access</span>
                </div>
                <div className="feature">
                  <i className="fas fa-check-circle"></i>
                  <span>DOI Assignment</span>
                </div>
                <div className="feature">
                  <i className="fas fa-check-circle"></i>
                  <span>Global Visibility</span>
                </div>
              </div>
              <Link to="/login" className="btn btn-success btn-lg">
                <i className="fas fa-upload"></i> Submit Manuscript
              </Link>
            </div>
          </Card>
        </section>

        {/* Quick Links Section */}
        <section className="quick-links-section">
          <h2>Quick Links</h2>
          <div className="quick-links-grid">
            <Link to="/about" className="quick-link-card">
              <i className="fas fa-info-circle"></i>
              <h3>About the Journal</h3>
              <p>Learn about our mission and editorial board</p>
            </Link>
            <Link to="/search" className="quick-link-card">
              <i className="fas fa-search"></i>
              <h3>Search Articles</h3>
              <p>Find research by topic, author, or keyword</p>
            </Link>
            <Link to="/archives" className="quick-link-card">
              <i className="fas fa-archive"></i>
              <h3>Archives</h3>
              <p>Browse all past issues and volumes</p>
            </Link>
            <Link to="/login" className="quick-link-card">
              <i className="fas fa-user"></i>
              <h3>Author Login</h3>
              <p>Submit and track your manuscripts</p>
            </Link>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default Home;