const Purchases = require("../models/Purchases");
const User = require("../models/User");
const {
  createPurchaseSchema,
  updatePurchaseSchema,
} = require("../validators/purchasesValidator");

// Create Purchase
const createPurchase = async (req, res) => {
  try {
    // Use validateAsync() for asynchronous validation
    const validatedData = await createPurchaseSchema.validateAsync(req.body);

    // Validate if the supplier exists
    const supplier = await User.findById(validatedData.suppliedBy);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    // Create a new purchase document
    const purchase = new Purchases({
      ...validatedData, // Spread the validated data
      createdBy: req.user.id, // Add the createdBy field
    });

    await purchase.save(); // Save purchase to the database

    res.status(201).json({ message: "Purchase created successfully", purchase });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};


// Update Purchase
const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updatePurchaseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const purchase = await Purchases.findById(id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    Object.assign(purchase, value, { updatedAt: Date.now() });
    await purchase.save();

    res
      .status(200)
      .json({ message: "Purchase updated successfully", purchase });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// View all purchases
const viewPurchases = async (req, res) => {
  try {
    const { from, to } = req.query;

    // Check if 'from' and 'to' dates are provided
    if (!from || !to) {
      return res
        .status(400)
        .json({ message: "Both 'from' and 'to' dates are required." });
    }

    // Fetch purchases within the date range
    const purchases = await Purchases.find({
      invoiceDate: { $gte: new Date(from), $lte: new Date(to) },
    })
      .populate("createdBy", "name")
      .populate("suppliedBy", "name")
      .sort({ invoiceDate: 1, invoiceNumber: 1 }); // Sorting by date, then by invoice number

    res.status(200).json({ purchases });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Get Purchase by ID
const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await Purchases.findById(id)
      .populate("createdBy", "name")
      .populate("suppliedBy", "name");

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    res.status(200).json({ purchase });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Delete Purchase
const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await Purchases.findById(id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    await purchase.remove();
    res.status(200).json({ message: "Purchase deleted successfully" });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

module.exports = {
  createPurchase,
  updatePurchase,
  viewPurchases,
  getPurchaseById,
  deletePurchase,
};
