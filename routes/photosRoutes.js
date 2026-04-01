const express = require("express");
const multer = require("multer");
const { list, upload, deletePhoto, updatePhotoOrder, listFeatured, toggleFeatured } = require("../controllers/photosController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
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
router.get("/featured", listFeatured);
router.post("/upload", requireAuth, imageUpload.single("image"), upload);
router.delete("/:id", requireAuth, deletePhoto);
router.patch("/order", requireAuth, updatePhotoOrder);
router.patch("/:id/featured", requireAuth, toggleFeatured);

module.exports = router;
