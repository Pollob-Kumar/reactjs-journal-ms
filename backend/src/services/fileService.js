const { getFileStream, deleteFile, getFileMetadata } = require('../config/gridfs');
const mongoose = require('mongoose');

// Download file
const downloadFile = async (fileId) => {
  try {
    const metadata = await getFileMetadata(fileId);
    
    if (!metadata) {
      throw new Error('File not found');
    }

    const stream = getFileStream(fileId);
    
    return {
      stream,
      filename: metadata.filename,
      originalName: metadata.metadata.originalName,
      contentType: metadata.contentType || 'application/octet-stream',
      size: metadata.length
    };
  } catch (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
};

// Delete file
const removeFile = async (fileId) => {
  try {
    await deleteFile(fileId);
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

// Get file information
const getFileInfo = async (fileId) => {
  try {
    const metadata = await getFileMetadata(fileId);
    
    if (!metadata) {
      throw new Error('File not found');
    }

    return {
      id: metadata._id,
      filename: metadata.filename,
      originalName: metadata.metadata.originalName,
      size: metadata.length,
      uploadDate: metadata.uploadDate,
      contentType: metadata.contentType,
      metadata: metadata.metadata
    };
  } catch (error) {
    throw new Error(`Failed to get file info: ${error.message}`);
  }
};

// Delete multiple files
const deleteMultipleFiles = async (fileIds) => {
  const results = [];
  
  for (const fileId of fileIds) {
    try {
      await deleteFile(fileId);
      results.push({ fileId, success: true });
    } catch (error) {
      results.push({ fileId, success: false, error: error.message });
    }
  }

  return results;
};

// Generate temporary download URL (for secure access)
const generateDownloadToken = (fileId, expiresIn = 3600) => {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  // In a production system, you would store this token in Redis or a cache
  // with an expiration time, mapped to the fileId
  // For now, we'll return a simple token
  
  return {
    token,
    fileId,
    expiresAt: new Date(Date.now() + expiresIn * 1000)
  };
};

module.exports = {
  downloadFile,
  removeFile,
  getFileInfo,
  deleteMultipleFiles,
  generateDownloadToken
};