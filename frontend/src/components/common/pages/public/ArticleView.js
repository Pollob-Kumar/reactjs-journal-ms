import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import PublicLayout from '../../components/common/PublicLayout';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import Card from '../../components/common/Card';
import './ArticleView.css';

const ArticleView = () => {
  const { articleId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [article, setArticle] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [viewMode, setViewMode] = useState('viewer'); // 'viewer' or 'download'

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/public/articles/${articleId}`);
      setArticle(response.data);

      // Get PDF URL for viewing
      if (response.data.manuscriptFile?.fileId) {
        const fileUrl = await getFileUrl(response.data.manuscriptFile.fileId);
        setPdfUrl(fileUrl);
      }

    } catch (err) {
      console.error('Error fetching article:', err);
      setError(err.response?.data?.message || 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = async (fileId) => {
    try {
      const response = await api.get(`/public/files/${fileId}`, {
        responseType: 'blob'
      });
      return URL.createObjectURL(response.data);
    } catch (err) {
      console.error('Error fetching file:', err);
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    try {
      if (!article?.manuscriptFile?.fileId) {
        alert('PDF file not found');
        return;
      }

      const response = await api.get(
        `/public/files/${article.manuscriptFile.fileId}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `${article.manuscriptId || 'article'}.pdf`
      );
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
    const year = new Date(article.publishedAt || article.submittedAt).getFullYear();

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
    }

    // Copy to clipboard
    navigator.clipboard.writeText(citation);
    alert(`${format.toUpperCase()} citation copied to clipboard!`);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!article) return <ErrorMessage message="Article not found" />;

  return (
    <PublicLayout>
      <div className="article-view">
        {/* Article Header */}
        <Card className="article-header-card">
          <div className="article-breadcrumb">
            <Link to="/">Home</Link>
            <i className="fas fa-chevron-right"></i>
            <Link to="/search">Articles</Link>
            <i className="fas fa-chevron-right"></i>
            <span>{article.manuscriptId}</span>
          </div>

          <h1 className="article-title">{article.title}</h1>

          {/* Authors */}
          <div className="article-authors">
            {article.authors?.map((author, index) => (
              <span key={index} className="author-name">
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
                <sup>{index + 1}</sup>
                {index < article.authors.length - 1 && ', '}
              </span>
            ))}
          </div>

          {/* Affiliations */}
          <div className="article-affiliations">
            {article.authors?.map((author, index) => (
              author.affiliation && (
                <p key={index}>
                  <sup>{index + 1}</sup> {author.affiliation}
                </p>
              )
            ))}
          </div>

          {/* Article Metadata */}
          <div className="article-metadata">
            {article.issue && (
              <div className="meta-item">
                <i className="fas fa-book"></i>
                <span>Volume {article.issue.volume}, Issue {article.issue.number} ({article.issue.year})</span>
              </div>
            )}
            <div className="meta-item">
              <i className="fas fa-calendar"></i>
              <span>Published: {new Date(article.publishedAt || article.submittedAt).toLocaleDateString('en-US', {
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
                <button onClick={() => handleCitation('apa')}>APA</button>
                <button onClick={() => handleCitation('mla')}>MLA</button>
                <button onClick={() => handleCitation('bibtex')}>BibTeX</button>
              </div>
            </div>
          </div>
        </Card>

        <div className="article-content-grid">
          {/* Left Column - Article Details */}
          <div className="article-details">
            {/* Abstract */}
            <Card className="section-card">
              <h2>Abstract</h2>
              <p className="abstract-text">{article.abstract}</p>
            </Card>

            {/* Keywords */}
            {article.keywords && article.keywords.length > 0 && (
              <Card className="section-card">
                <h2>Keywords</h2>
                <div className="keywords-list">
                  {article.keywords.map((keyword, index) => (
                    <Link
                      key={index}
                      to={`/search?keyword=${encodeURIComponent(keyword)}`}
                      className="keyword-tag"
                    >
                      {keyword}
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* PDF Viewer */}
            <Card className="section-card pdf-section">
              <div className="pdf-header">
                <h2>Full Text</h2>
                <div className="view-toggle">
                  <button
                    onClick={() => setViewMode('viewer')}
                    className={`toggle-btn ${viewMode === 'viewer' ? 'active' : ''}`}
                  >
                    <i className="fas fa-eye"></i> View
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="toggle-btn"
                  >
                    <i className="fas fa-download"></i> Download
                  </button>
                </div>
              </div>

              {viewMode === 'viewer' && pdfUrl ? (
                <div className="pdf-viewer-container">
                  <iframe
                    src={pdfUrl}
                    title="Article PDF"
                    className="pdf-iframe"
                  />
                </div>
              ) : (
                <div className="pdf-download-prompt">
                  <i className="fas fa-file-pdf"></i>
                  <h3>Download to Read</h3>
                  <p>Click the button above to download the full article PDF</p>
                </div>
              )}
            </Card>

            {/* Supplementary Files */}
            {article.supplementaryFiles && article.supplementaryFiles.length > 0 && (
              <Card className="section-card">
                <h2>Supplementary Materials</h2>
                <div className="supplementary-files">
                  {article.supplementaryFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <i className="fas fa-file"></i>
                      <div className="file-info">
                        <h4>{file.filename}</h4>
                        <span>{(file.size / 1024).toFixed(2)} KB</span>
                      </div>
                      <a
                        href={`/api/public/files/${file.fileId}`}
                        download
                        className="btn btn-sm btn-outline"
                      >
                        <i className="fas fa-download"></i> Download
                      </a>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Sidebar - Article Info */}
          <div className="article-sidebar">
            {/* Article Metrics */}
            <Card className="sidebar-card">
              <h3>Article Metrics</h3>
              <div className="metrics-list">
                <div className="metric-item">
                  <i className="fas fa-eye"></i>
                  <div>
                    <strong>Views</strong>
                    <span>{article.views || 0}</span>
                  </div>
                </div>
                <div className="metric-item">
                  <i className="fas fa-download"></i>
                  <div>
                    <strong>Downloads</strong>
                    <span>{article.downloads || 0}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Issue Information */}
            {article.issue && (
              <Card className="sidebar-card">
                <h3>Published In</h3>
                <div className="issue-info">
                  <p><strong>Volume {article.issue.volume}, Issue {article.issue.number}</strong></p>
                  <p>{article.issue.title}</p>
                  <p className="issue-year">{article.issue.year}</p>
                  <Link to={`/issue/${article.issue._id}`} className="btn btn-sm btn-outline btn-block">
                    <i className="fas fa-book"></i> View Issue
                  </Link>
                </div>
              </Card>
            )}

            {/* License */}
            <Card className="sidebar-card">
              <h3>Copyright & License</h3>
              <p className="license-text">
                Copyright © {new Date(article.publishedAt || article.submittedAt).getFullYear()} by the authors. 
                This is an open access article distributed under the terms of the Creative Commons Attribution License.
              </p>
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="license-badge"
              >
                <i className="fab fa-creative-commons"></i> CC BY 4.0
              </a>
            </Card>

            {/* Share */}
            <Card className="sidebar-card">
              <h3>Share This Article</h3>
              <div className="share-buttons">
                <button className="share-btn twitter">
                  <i className="fab fa-twitter"></i>
                </button>
                <button className="share-btn facebook">
                  <i className="fab fa-facebook"></i>
                </button>
                <button className="share-btn linkedin">
                  <i className="fab fa-linkedin"></i>
                </button>
                <button className="share-btn email">
                  <i className="fas fa-envelope"></i>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ArticleView;