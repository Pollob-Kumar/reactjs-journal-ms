const { upload } = require('../config/gridfs');

// Single file upload
exports.uploadSingleFile = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size exceeds the 50MB limit'
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

// Multiple files upload
exports.uploadMultipleFiles = (fieldName, maxCount = 10) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'One or more files exceed the 50MB limit'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Too many files. Maximum ${maxCount} files allowed`
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};