const express = require("express");
const multer = require("multer");
const { list, upload } = require("../controllers/photosController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      const err = new Error("Only image uploads are allowed");
      err.status = 400;
      cb(err);
      return;
    }
    cb(null, true);
  },
});

router.get("/", list);
router.post("/upload", requireAuth, imageUpload.single("image"), upload);

module.exports = router;
