const express = require("express");
const multer = require("multer");
const { list, add, remove } = require("../controllers/bibliographyController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Configure multer for image uploads
const coverUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    // Support multiple image formats
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "image/tiff",
    ];
    if (!file.mimetype || !allowedMimes.includes(file.mimetype)) {
      const err = new Error("Only image uploads (JPEG, PNG, WEBP, HEIC, TIFF) are allowed");
      err.status = 400;
      cb(err);
      return;
    }
    cb(null, true);
  },
});

// Public read access
router.get("/", list);

// Protected write access
router.post("/", requireAuth, coverUpload.single("cover"), add);
router.delete("/:id", requireAuth, remove);

module.exports = router;
