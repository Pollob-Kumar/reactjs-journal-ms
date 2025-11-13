import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import PublicLayout from '../../components/common/PublicLayout.jsx';
import Loading from '../../components/common/Loading.jsx';
import ErrorMessage from '../../components/common/ErrorMessage.jsx';
import Card from '../../components/common/Card.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { Link } from 'react-router-dom';
import './Search.css';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [articles, setArticles] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalArticles: 0,
    limit: 12
  });

  // Search filters
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    author: searchParams.get('author') || '',
    keyword: searchParams.get('keyword') || '',
    year: searchParams.get('year') || '',
    sortBy: searchParams.get('sortBy') || 'publishedAt',
    sortOrder: searchParams.get('sortOrder') || 'desc'
  });

  useEffect(() => {
    if (filters.query || filters.author || filters.keyword || filters.year) {
      searchArticles();
    }
  }, [pagination.currentPage, filters]);

  const searchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      if (filters.query) params.q = filters.query;
      if (filters.author) params.author = filters.author;
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.year) params.year = filters.year;

      const response = await api.get('/public/articles/search', { params });

      setArticles(response.data.articles || response.data);
      setPagination({
        ...pagination,
        totalPages: response.data.totalPages || 1,
        totalArticles: response.data.total || response.data.length,
        currentPage: response.data.currentPage || 1
      });

    } catch (err) {
      console.error('Error searching articles:', err);
      setError(err.response?.data?.message || 'Failed to search articles');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, currentPage: 1 });
    
    // Update URL params
    const newParams = new URLSearchParams();
    if (filters.query) newParams.set('q', filters.query);
    if (filters.author) newParams.set('author', filters.author);
    if (filters.keyword) newParams.set('keyword', filters.keyword);
    if (filters.year) newParams.set('year', filters.year);
    if (filters.sortBy !== 'publishedAt') newParams.set('sortBy', filters.sortBy);
    if (filters.sortOrder !== 'desc') newParams.set('sortOrder', filters.sortOrder);
    
    setSearchParams(newParams);
    searchArticles();
  };

  const handlePageChange = (page) => {
    setPagination({ ...pagination, currentPage: page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      author: '',
      keyword: '',
      year: '',
      sortBy: 'publishedAt',
      sortOrder: 'desc'
    });
    setSearchParams({});
    setArticles([]);
  };

  return (
    <PublicLayout>
      <div className="search-page">
        {/* Search Header */}
        <div className="search-header">
          <h1>Search Articles</h1>
          <p>Browse our comprehensive collection of published research</p>
        </div>

        {/* Search Form */}
        <Card className="search-form-card">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-inputs">
              <div className="search-input-group main-search">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by title or abstract..."
                  value={filters.query}
                  onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                />
              </div>

              <div className="search-input-group">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  placeholder="Author name..."
                  value={filters.author}
                  onChange={(e) => setFilters({ ...filters, author: e.target.value })}
                />
              </div>

              <div className="search-input-group">
                <i className="fas fa-tag"></i>
                <input
                  type="text"
                  placeholder="Keywords..."
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                />
              </div>

              <div className="search-input-group">
                <i className="fas fa-calendar"></i>
                <input
                  type="number"
                  placeholder="Year..."
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  min="2000"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            <div className="search-actions">
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-search"></i> Search
              </button>
              <button type="button" onClick={clearFilters} className="btn btn-outline">
                <i className="fas fa-times"></i> Clear
              </button>
            </div>
          </form>

          {/* Sort Options */}
          <div className="sort-options">
            <label>Sort by:</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="sort-select"
            >
              <option value="publishedAt">Publication Date</option>
              <option value="title">Title</option>
              <option value="relevance">Relevance</option>
            </select>
            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
              className="sort-select"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </Card>

        {error && <ErrorMessage message={error} />}

        {/* Search Results */}
        {loading ? (
          <Loading />
        ) : articles.length > 0 ? (
          <>
            <div className="search-results-header">
              <h2>
                Found {pagination.totalArticles} article{pagination.totalArticles !== 1 ? 's' : ''}
              </h2>
            </div>

            <div className="search-results">
              {articles.map((article) => (
                <Card key={article._id} className="article-result">
                  <div className="article-header">
                    <h3>
                      <Link to={`/article/${article._id}`}>
                        {article.title}
                      </Link>
                    </h3>
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
                  </div>

                  <div className="article-authors">
                    <i className="fas fa-users"></i>
                    {article.authors?.slice(0, 5).map((author, index) => (
                      <span key={index}>
                        {author.firstName} {author.lastName}
                        {index < Math.min(4, article.authors.length - 1) && ', '}
                      </span>
                    ))}
                    {article.authors?.length > 5 && ' et al.'}
                  </div>

                  <p className="article-abstract">
                    {article.abstract?.substring(0, 300)}...
                  </p>

                  {article.keywords && article.keywords.length > 0 && (
                    <div className="article-keywords">
                      <strong>Keywords:</strong>
                      {article.keywords.map((keyword, index) => (
                        <span key={index} className="keyword-tag">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="article-footer">
                    <div className="article-meta">
                      <span>
                        <i className="fas fa-calendar"></i>
                        Published: {new Date(article.publishedAt || article.submittedAt).toLocaleDateString()}
                      </span>
                      {article.issue && (
                        <span>
                          <i className="fas fa-book"></i>
                          Vol. {article.issue.volume}, No. {article.issue.number} ({article.issue.year})
                        </span>
                      )}
                    </div>
                    <Link to={`/article/${article._id}`} className="btn btn-primary btn-sm">
                      <i className="fas fa-file-pdf"></i> View Article
                    </Link>
                  </div>
                </Card>
              ))}
            </div>

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
            <i className="fas fa-search empty-icon"></i>
            <h3>No Articles Found</h3>
            <p>
              {filters.query || filters.author || filters.keyword || filters.year
                ? 'Try adjusting your search criteria or clearing filters.'
                : 'Enter search terms above to find articles.'}
            </p>
          </Card>
        )}
      </div>
    </PublicLayout>
  );
};

export default Search;