const express = require("express");
const {
  createImport,
  getAllImports,
  getImportById,
  updateImport,
  deleteImport,
} = require("../controllers/importController");
const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const importFileUpload = require("../middlewares/importFileUploadMiddleware");

const router = express.Router();

// Create Import (with optional file upload)
router.post(
  "/",
  protect,
  authorize("create_imports"),
  importFileUpload.array("billPhotos", 10), // Support multiple file uploads
  createImport
);

// Get All Imports (with pagination and filters)
router.get("/", protect, authorize("view_imports"), getAllImports);

// Get Import by ID
router.get("/:id", protect, authorize("view_imports"), getImportById);

// Update Import (with optional file upload)
router.put(
  "/:id",
  protect,
  authorize("update_imports"),
  importFileUpload.array("billPhotos", 10), // Support multiple file uploads
  updateImport
);

// Delete Import
router.delete("/:id", protect, authorize("delete_imports"), deleteImport);

module.exports = router;

