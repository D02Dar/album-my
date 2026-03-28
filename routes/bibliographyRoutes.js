const express = require("express");
const { list, add, remove } = require("../controllers/bibliographyController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Public read access
router.get("/", list);

// Protected write access
router.post("/", requireAuth, add);
router.delete("/:id", requireAuth, remove);

module.exports = router;
