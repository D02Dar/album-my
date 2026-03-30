const express = require("express");
const {
  listCategories,
  createCategory,
} = require("../controllers/biblioCategoryController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Public: List all categories
router.get("/", listCategories);

// Admin: Create new category
router.post("/", requireAuth, createCategory);

module.exports = router;
