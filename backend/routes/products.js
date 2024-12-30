const express = require("express");
const {
  createProduct,
  getProductById,
  getAllProducts,
  updateProduct,
  deleteProduct,
  uploadProductsByFile,
} = require("../controllers/productsController");
const { protect, roleBasedAccess } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/fileUploadMiddleware");

const router = express.Router();

// Create Product
router.post(
  "/",
  protect,
  roleBasedAccess(["staff", "manager", "superadmin"]),
  createProduct
);

// Get Single Product by ID
router.get(
  "/:id",
  protect,
  roleBasedAccess(["staff", "manager", "superadmin"]),
  getProductById
);

// Get All Products
router.get(
  "/",
  protect,
  roleBasedAccess(["staff", "manager", "superadmin"]),
  getAllProducts
);

// Update Product
router.put(
  "/:id",
  protect,
  roleBasedAccess(["staff", "manager", "superadmin"]),
  updateProduct
);

// Delete Product
router.delete("/:id", protect, roleBasedAccess(["superadmin"]), deleteProduct);

// Bulk Upload Products via File
router.post(
  "/upload",
  protect,
  roleBasedAccess(["superadmin"]),
  upload.single("file"),
  uploadProductsByFile
);

module.exports = router;
