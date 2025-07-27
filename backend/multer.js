const { storage } = require("./cloudinary");
const multer = require("multer");

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  console.log("Debug - File MIME type:", file.mimetype);
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only JPEG, PNG, JPG, and WebP are allowed. Received: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = upload;