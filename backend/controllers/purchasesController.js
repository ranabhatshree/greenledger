const Purchases = require("../models/Purchases");
const User = require("../models/User");
const Party = require("../models/Party");
const {
  createPurchaseSchema,
  updatePurchaseSchema,
} = require("../validators/purchasesValidator");

// Create Purchase
const createPurchase = async (req, res, next) => {
  try {
    // Use validateAsync() for asynchronous validation
    const validatedData = await createPurchaseSchema.validateAsync(req.body);

    // Validate if the party exists
    const party = await Party.findOne({ 
      _id: validatedData.suppliedBy, 
      companyId: req.user.companyId 
    });
    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    // Create a new purchase document
    const purchase = new Purchases({
      ...validatedData, // Spread the validated data
      companyId: req.user.companyId, // Set companyId from authenticated user
      createdBy: req.user.id, // Add the createdBy field
    });

    await purchase.save(); // Save purchase to the database

    res.status(201).json({ message: "Purchase created successfully", purchase });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};


// Update Purchase
const updatePurchase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updatePurchaseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const purchase = await Purchases.findOne({ _id: id, companyId: req.user.companyId });
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    // Validate suppliedBy if it's being updated
    if (value.suppliedBy && value.suppliedBy.toString() !== purchase.suppliedBy.toString()) {
      const party = await Party.findOne({ 
        _id: value.suppliedBy, 
        companyId: req.user.companyId 
      });
      if (!party) {
        return res.status(404).json({ message: "Party not found or does not belong to your company" });
      }
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
const viewPurchases = async (req, res, next) => {
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
      companyId: req.user.companyId, // Filter by company
      invoiceDate: { $gte: new Date(from), $lte: new Date(to) },
    })
      .populate("createdBy", "name")
      .populate("suppliedBy", "name phone email")
      .sort({ invoiceDate: 1, invoiceNumber: 1 }); // Sorting by date, then by invoice number

    res.status(200).json({ purchases });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Get Purchase by ID
const getPurchaseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const purchase = await Purchases.findOne({ 
      _id: id, 
      companyId: req.user.companyId 
    })
      .populate("createdBy", "name")
      .populate("suppliedBy", "name phone email");

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    res.status(200).json({ purchase });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Delete Purchase
const deletePurchase = async (req, res, next) => {
  try {
    const { id } = req.params;

    const purchase = await Purchases.findOne({ _id: id, companyId: req.user.companyId });
    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    await purchase.deleteOne();
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
