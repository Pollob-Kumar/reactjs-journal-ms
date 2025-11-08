const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');

let gfs;
let gridfsBucket;

// Initialize GridFS
const initGridFS = () => {
  const conn = mongoose.connection;
  
  conn.once('open', () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });
    
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    
    console.log('GridFS initialized');
  });
};

// Create storage engine
const storage = new GridFsStorage({
  url: process.env.MONGODB_URI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads',
          metadata: {
            originalName: file.originalname,
            uploadedBy: req.user ? req.user.id : null,
            uploadDate: new Date(),
            manuscriptId: req.body.manuscriptId || null,
            fileType: req.body.fileType || 'manuscript' // manuscript, supplementary, revision, response
          }
        };
        resolve(fileInfo);
      });
    });
  }
});

// File filter for allowed extensions
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
    'text/plain'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, DOC, images, and ZIP files are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit as per SRS (NFR-1.2)
  },
  fileFilter
});

// Helper function to get file stream
const getFileStream = (fileId) => {
  if (!gridfsBucket) {
    throw new Error('GridFS not initialized');
  }
  return gridfsBucket.openDownloadStream(mongoose.Types.ObjectId(fileId));
};

// Helper function to delete file
const deleteFile = async (fileId) => {
  if (!gridfsBucket) {
    throw new Error('GridFS not initialized');
  }
  return gridfsBucket.delete(mongoose.Types.ObjectId(fileId));
};

// Helper function to get file metadata
const getFileMetadata = async (fileId) => {
  if (!gfs) {
    throw new Error('GridFS not initialized');
  }
  
  return new Promise((resolve, reject) => {
    gfs.files.findOne({ _id: mongoose.Types.ObjectId(fileId) }, (err, file) => {
      if (err) reject(err);
      resolve(file);
    });
  });
};

module.exports = {
  initGridFS,
  upload,
  getFileStream,
  deleteFile,
  getFileMetadata,
  getGFS: () => gfs,
  getGridFSBucket: () => gridfsBucket
};