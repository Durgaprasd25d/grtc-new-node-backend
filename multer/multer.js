const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Destination folder for uploads
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`); // Ensure unique filename
  }
});

// File filter for image and Excel files
const fileFilter = (req, file, cb) => {
  const imageMimeTypes = /image/;
  const excelMimeTypes = /xlsx/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (imageMimeTypes.test(mimetype) || excelMimeTypes.test(extname)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and Excel files (.xlsx) are allowed!'), false);
  }
};

// Init upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 } // Limit file size to 10MB (both image and Excel)
});

module.exports = upload;
