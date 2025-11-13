// frontend/src/components/common/pages/public/ArticleView.js - Update to use stable URLs

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import api from '../../services/api';
import PublicLayout from '../../components/common/PublicLayout';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import Card from '../../components/common/Card';
import './ArticleView.css';

const ArticleView = () => {
  const { articleId, doi } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [article, setArticle] = useState(null);
  const [viewMode, setViewMode] = useState('viewer');
  const isDOIRoute = location.pathname.includes('/doi/');

  useEffect(() => {
    fetchArticle();
  }, [articleId, doi]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (isDOIRoute && doi) {
        // Fetch by DOI
        response = await api.get(`/public/articles/doi/${encodeURIComponent(doi)}`);
      } else {
        // Fetch by manuscript ID
        response = await api.get(`/public/articles/${articleId}`);
      }
      
      setArticle(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching article:', err);
      setError(err.response?.data?.message || 'Failed to load article');
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const manuscriptId = article.manuscriptId || article._id;
      const response = await api.get(`/public/articles/${manuscriptId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${article.manuscriptId || 'article'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF');
    }
  };

  const handleCitation = (format) => {
    if (!article) return;

    let citation = '';
    const authors = article.authors?.map(a => `${a.lastName}, ${a.firstName.charAt(0)}.`).join(', ') || '';
    const year = new Date(article.publishedDate || article.submittedAt).getFullYear();

    switch (format) {
      case 'apa':
        citation = `${authors} (${year}). ${article.title}. Journal of Pundra University of Science & Technology, ${article.issue?.volume}(${article.issue?.number}).`;
        if (article.doi) citation += ` https://doi.org/${article.doi}`;
        break;
      case 'mla':
        citation = `${authors} "${article.title}." Journal of Pundra University of Science & Technology, vol. ${article.issue?.volume}, no. ${article.issue?.number}, ${year}.`;
        break;
      case 'bibtex':
        citation = `@article{${article.manuscriptId},\n  author = {${authors}},\n  title = {${article.title}},\n  journal = {Journal of Pundra University of Science & Technology},\n  volume = {${article.issue?.volume}},\n  number = {${article.issue?.number}},\n  year = {${year}}`;
        if (article.doi) citation += `,\n  doi = {${article.doi}}`;
        citation += '\n}';
        break;
      case 'chicago':
        citation = `${authors} "${article.title}." Journal of Pundra University of Science & Technology ${article.issue?.volume}, no. ${article.issue?.number} (${year}).`;
        if (article.doi) citation += ` https://doi.org/${article.doi}`;
        break;
    }

    navigator.clipboard.writeText(citation);
    alert(`${format.toUpperCase()} citation copied to clipboard!`);
  };

  const shareArticle = (platform) => {
    const url = article.publicUrl || window.location.href;
    const title = encodeURIComponent(article.title);
    const shareUrl = article.doi 
      ? `https://doi.org/${article.doi}` 
      : url;

    let shareLink = '';
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${title}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'email':
        shareLink = `mailto:?subject=${title}&body=Check out this article: ${encodeURIComponent(shareUrl)}`;
        break;
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!article) return <ErrorMessage message="Article not found" />;

  return (
    <PublicLayout>
      <div className="article-view">
        <div className="article-container">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="separator">/</span>
            <Link to="/search">Articles</Link>
            <span className="separator">/</span>
            <span className="current">{article.manuscriptId}</span>
          </div>

          {/* Article Header */}
          <Card className="article-header">
            <div className="article-type-badge">Research Article</div>
            <h1 className="article-title">{article.title}</h1>

            {/* Authors */}
            <div className="article-authors">
              {article.authors?.map((author, index) => (
                <span key={index} className="author-name">
                  {author.firstName} {author.lastName}
                  {author.isCorresponding && <sup>*</sup>}
                  {index < article.authors.length - 1 && ', '}
                </span>
              ))}
            </div>

            {/* Affiliations */}
            <div className="article-affiliations">
              {Array.from(new Set(article.authors?.map(a => a.affiliation))).map((affiliation, index) => (
                <div key={index} className="affiliation">
                  <sup>{index + 1}</sup> {affiliation}
                </div>
              ))}
              <div className="corresponding-author">
                <sup>*</sup> Corresponding author
              </div>
            </div>

            {/* Metadata */}
            <div className="article-meta">
              <div className="meta-item">
                <i className="fas fa-calendar"></i>
                <span>Published: {new Date(article.publishedDate || article.submittedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              {article.doi && (
                <div className="meta-item">
                  <i className="fas fa-link"></i>
                  <a
                    href={`https://doi.org/${article.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doi-link"
                  >
                    DOI: {article.doi}
                  </a>
                </div>
              )}
              {article.publicUrl && (
                <div className="meta-item">
                  <i className="fas fa-external-link-alt"></i>
                  <a
                    href={article.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="public-url-link"
                  >
                    Permanent Link
                  </a>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="article-actions">
              <button onClick={handleDownloadPDF} className="btn btn-primary">
                <i className="fas fa-download"></i> Download PDF
              </button>
              
              <div className="citation-dropdown">
                <button className="btn btn-outline">
                  <i className="fas fa-quote-right"></i> Cite This Article
                </button>
                <div className="citation-menu">
                  <button onClick={() => handleCitation('apa')}>
                    <i className="fas fa-file-alt"></i> APA Format
                  </button>
                  <button onClick={() => handleCitation('mla')}>
                    <i className="fas fa-file-alt"></i> MLA Format
                  </button>
                  <button onClick={() => handleCitation('chicago')}>
                    <i className="fas fa-file-alt"></i> Chicago Format
                  </button>
                  <button onClick={() => handleCitation('bibtex')}>
                    <i className="fas fa-code"></i> BibTeX
                  </button>
                </div>
              </div>

              <div className="share-dropdown">
                <button className="btn btn-outline">
                  <i className="fas fa-share-alt"></i> Share
                </button>
                <div className="share-menu">
                  <button onClick={() => shareArticle('twitter')}>
                    <i className="fab fa-twitter"></i> Twitter
                  </button>
                  <button onClick={() => shareArticle('linkedin')}>
                    <i className="fab fa-linkedin"></i> LinkedIn
                  </button>
                  <button onClick={() => shareArticle('facebook')}>
                    <i className="fab fa-facebook"></i> Facebook
                  </button>
                  <button onClick={() => shareArticle('email')}>
                    <i className="fas fa-envelope"></i> Email
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Abstract */}
          <Card className="article-section">
            <h2>Abstract</h2>
            <p className="abstract-text">{article.abstract}</p>
          </Card>

          {/* Keywords */}
          {article.keywords && article.keywords.length > 0 && (
            <Card className="article-section">
              <h3>Keywords</h3>
              <div className="keywords-list">
                {article.keywords.map((keyword, index) => (
                  <span key={index} className="keyword-tag">
                    {keyword}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Article Info */}
          <Card className="article-section">
            <h3>Article Information</h3>
            <div className="article-info-grid">
              <div className="info-item">
                <label>Manuscript ID</label>
                <span>{article.manuscriptId}</span>
              </div>
              <div className="info-item">
                <label>Submission Date</label>
                <span>{new Date(article.submittedAt).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <label>Publication Date</label>
                <span>{new Date(article.publishedDate || article.submittedAt).toLocaleDateString()}</span>
              </div>
              {article.doi && (
                <div className="info-item">
                  <label>DOI</label>
                  <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener noreferrer">
                    {article.doi}
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* Suggested Citation */}
          <Card className="article-section citation-box">
            <h3>How to Cite</h3>
            <div className="citation-text">
              {article.authors?.map(a => `${a.lastName}, ${a.firstName.charAt(0)}.`).join(', ')} (
              {new Date(article.publishedDate || article.submittedAt).getFullYear()}). {article.title}. 
              <em> Journal of Pundra University of Science & Technology</em>.
              {article.doi && ` https://doi.org/${article.doi}`}
            </div>
            <button 
              onClick={() => handleCitation('apa')} 
              className="btn btn-sm btn-outline"
            >
              <i className="fas fa-copy"></i> Copy Citation
            </button>
          </Card>

          {/* Related Articles (Future Enhancement) */}
          <Card className="article-section">
            <h3>Related Articles</h3>
            <p className="text-muted">Related articles will appear here.</p>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ArticleView;
