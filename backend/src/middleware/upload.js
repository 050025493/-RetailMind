import multer from 'multer';
import path from 'path';

// Configure storage
const storage = multer.memoryStorage(); // Store in memory for processing

// File filter
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.csv', '.xlsx', '.xls'];
  const allowedMimes = [
    'text/csv', 
    'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain' // Some systems upload CSVs as text/plain
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and Excel files are allowed'), false);
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});