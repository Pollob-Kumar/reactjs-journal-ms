import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaUpload, FaFile, FaTimes } from 'react-icons/fa';
import './FileUpload.css';

const FileUpload = ({ 
  files = [], 
  onFilesChange, 
  accept = '.pdf,.doc,.docx',
  maxSize = 50 * 1024 * 1024, // 50MB
  multiple = false,
  label = 'Upload Files'
}) => {
  const onDrop = useCallback((acceptedFiles) => {
    if (multiple) {
      onFilesChange([...files, ...acceptedFiles]);
    } else {
      onFilesChange(acceptedFiles);
    }
  }, [files, multiple, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: accept.split(',').reduce((acc, curr) => ({ ...acc, [curr.trim()]: [] }), {}),
    maxSize,
    multiple
  });

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="file-upload-container">
      <label className="file-upload-label">{label}</label>
      
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <FaUpload className="upload-icon" />
        {isDragActive ? (
          <p>Drop the files here...</p>
        ) : (
          <p>Drag & drop files here, or click to select files</p>
        )}
        <p className="upload-hint">
          Accepted formats: {accept} (Max: {formatFileSize(maxSize)})
        </p>
      </div>

      {fileRejections.length > 0 && (
        <div className="file-errors">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.path} className="error-item">
              <strong>{file.path}</strong>
              <ul>
                {errors.map(e => (
                  <li key={e.code}>{e.message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="uploaded-files">
          <h4>Selected Files:</h4>
          <ul>
            {files.map((file, index) => (
              <li key={index} className="file-item">
                <FaFile className="file-icon" />
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{formatFileSize(file.size)}</span>
                </div>
                <button
                  type="button"
                  className="remove-file"
                  onClick={() => removeFile(index)}
                >
                  <FaTimes />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;