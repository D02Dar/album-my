const express = require("express");
const galleryCategoryController = require("../controllers/galleryCategoryController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Get all gallery categories (public)
router.get("/", async (req, res, next) => {
  try {
    const categories = await galleryCategoryController.listCategories();
    res.json({ categories });
  } catch (e) {
    next(e);
  }
});

// Create new gallery category (authenticated)
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { name } = req.body;
    const category = await galleryCategoryController.createCategory(name);
    res.status(201).json({ category });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
