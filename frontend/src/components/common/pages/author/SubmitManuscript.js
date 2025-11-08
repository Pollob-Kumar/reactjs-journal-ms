import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import manuscriptService from '../../services/manuscriptService';
import Card from '../../components/common/Card';
import FileUpload from '../../components/common/FileUpload';
import { FaPaperPlane, FaTimes, FaPlus } from 'react-icons/fa';
import './SubmitManuscript.css';

const SubmitManuscript = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [authors, setAuthors] = useState([
    { firstName: '', lastName: '', email: '', affiliation: '', orcid: '', isCorresponding: true }
  ]);
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');

  const formik = useFormik({
    initialValues: {
      title: '',
      abstract: ''
    },
    validationSchema: Yup.object({
      title: Yup.string()
        .max(500, 'Title must be 500 characters or less')
        .required('Title is required'),
      abstract: Yup.string()
        .max(5000, 'Abstract must be 5000 characters or less')
        .required('Abstract is required')
    }),
    onSubmit: async (values) => {
      // Validation
      if (files.length === 0) {
        toast.error('Please upload at least one manuscript file');
        return;
      }

      if (authors.some(a => !a.firstName || !a.lastName || !a.email || !a.affiliation)) {
        toast.error('Please complete all author information');
        return;
      }

      if (!authors.some(a => a.isCorresponding)) {
        toast.error('Please select a corresponding author');
        return;
      }

      setLoading(true);

      try {
        // Create FormData
        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('abstract', values.abstract);
        formData.append('keywords', JSON.stringify(keywords));
        formData.append('authors', JSON.stringify(authors));

        // Append files
        files.forEach((file, index) => {
          formData.append('files', file);
        });

        await manuscriptService.submitManuscript(formData);
        toast.success('Manuscript submitted successfully!');
        navigate('/author/submissions');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to submit manuscript');
      } finally {
        setLoading(false);
      }
    }
  });

  const addAuthor = () => {
    setAuthors([
      ...authors,
      { firstName: '', lastName: '', email: '', affiliation: '', orcid: '', isCorresponding: false }
    ]);
  };

  const removeAuthor = (index) => {
    if (authors.length > 1) {
      const newAuthors = authors.filter((_, i) => i !== index);
      // Ensure at least one corresponding author
      if (!newAuthors.some(a => a.isCorresponding)) {
        newAuthors[0].isCorresponding = true;
      }
      setAuthors(newAuthors);
    }
  };

  const updateAuthor = (index, field, value) => {
    const newAuthors = [...authors];
    newAuthors[index][field] = value;
    setAuthors(newAuthors);
  };

  const setCorrespondingAuthor = (index) => {
    const newAuthors = authors.map((author, i) => ({
      ...author,
      isCorresponding: i === index
    }));
    setAuthors(newAuthors);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleKeywordKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  return (
    <div className="submit-manuscript">
      <div className="page-header">
        <h1>Submit New Manuscript</h1>
        <p>Please fill in all required fields to submit your manuscript</p>
      </div>

      <form onSubmit={formik.handleSubmit}>
        {/* Manuscript Details */}
        <Card title="Manuscript Details">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className={`form-control ${formik.touched.title && formik.errors.title ? 'error' : ''}`}
              placeholder="Enter manuscript title"
              {...formik.getFieldProps('title')}
            />
            {formik.touched.title && formik.errors.title && (
              <div className="form-error">{formik.errors.title}</div>
            )}
            <small className="form-help">
              Characters: {formik.values.title.length}/500
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="abstract" className="form-label">
              Abstract *
            </label>
            <textarea
              id="abstract"
              name="abstract"
              rows="10"
              className={`form-control ${formik.touched.abstract && formik.errors.abstract ? 'error' : ''}`}
              placeholder="Enter manuscript abstract"
              {...formik.getFieldProps('abstract')}
            />
            {formik.touched.abstract && formik.errors.abstract && (
              <div className="form-error">{formik.errors.abstract}</div>
            )}
            <small className="form-help">
              Characters: {formik.values.abstract.length}/5000
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Keywords</label>
            <div className="keyword-input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Enter keyword and press Enter"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={handleKeywordKeyPress}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addKeyword}
              >
                <FaPlus /> Add
              </button>
            </div>
            {keywords.length > 0 && (
              <div className="keywords-list">
                {keywords.map((keyword, index) => (
                  <span key={index} className="keyword-tag">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="keyword-remove"
                    >
                      <FaTimes />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Authors */}
        <Card 
          title="Author Information"
          actions={
            <button type="button" className="btn btn-sm btn-secondary" onClick={addAuthor}>
              <FaPlus /> Add Author
            </button>
          }
        >
          {authors.map((author, index) => (
            <div key={index} className="author-section">
              <div className="author-header">
                <h4>Author {index + 1}</h4>
                {authors.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeAuthor(index)}
                  >
                    <FaTimes /> Remove
                  </button>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={author.firstName}
                    onChange={(e) => updateAuthor(index, 'firstName', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={author.lastName}
                    onChange={(e) => updateAuthor(index, 'lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={author.email}
                    onChange={(e) => updateAuthor(index, 'email', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ORCID</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0000-0002-1825-0097"
                    value={author.orcid}
                    onChange={(e) => updateAuthor(index, 'orcid', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Affiliation *</label>
                <input
                  type="text"
                  className="form-control"
                  value={author.affiliation}
                  onChange={(e) => updateAuthor(index, 'affiliation', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={author.isCorresponding}
                    onChange={() => setCorrespondingAuthor(index)}
                  />
                  <span>Corresponding Author</span>
                </label>
              </div>
            </div>
          ))}
        </Card>

        {/* File Upload */}
        <Card title="Manuscript Files">
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            accept=".pdf,.doc,.docx"
            multiple={true}
            label="Upload Manuscript and Supplementary Files *"
          />
          <small className="form-help">
            Please upload your manuscript in PDF or DOCX format. You can also upload supplementary files.
          </small>
        </Card>

        {/* Submit Buttons */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/author/dashboard')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div> Submitting...
              </>
            ) : (
              <>
                <FaPaperPlane /> Submit Manuscript
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitManuscript;