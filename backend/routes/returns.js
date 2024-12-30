const express = require("express");
const {
  createReturn,
  updateReturn,
  viewReturns,
  getReturnById,
  deleteReturn,
} = require("../controllers/returnsController");
const { protect, roleBasedAccess } = require("../middlewares/authMiddleware");

const router = express.Router();

// Create Return
router.post(
  "/",
  protect,
  roleBasedAccess(["staff", "manager", "superadmin"]),
  createReturn
);

// Update Return
router.put(
  "/:id",
  protect,
  roleBasedAccess(["staff", "manager", "superadmin"]),
  updateReturn
);

// View All Returns
router.get(
  "/",
  protect,
  roleBasedAccess(["staff", "manager", "superadmin"]),
  viewReturns
);

// Get Return by ID
router.get(
  "/:id",
  protect,
  roleBasedAccess(["staff", "manager", "superadmin"]),
  getReturnById
);

// Delete Return
router.delete("/:id", protect, roleBasedAccess(["superadmin"]), deleteReturn);

module.exports = router;
