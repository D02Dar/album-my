const express = require("express");
const { getImage } = require("../controllers/storageController");

const router = express.Router();

// GET /api/storage/image?url=...
// 代理图片请求，避免 CORS 问题
router.get("/image", getImage);

module.exports = router;
