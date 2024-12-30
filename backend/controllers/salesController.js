const Sales = require("../models/Sales");
const User = require("../models/User");
const {
  createSaleSchema,
  updateSaleSchema,
} = require("../validators/salesValidator");
const Product = require("../models/Products");
const mongoose = require("mongoose")

// Create Sale
const createSale = async (req, res) => {
  try {
    // Use validateAsync() to handle asynchronous validation
    const value = await createSaleSchema.validateAsync(req.body);

    const {
      invoiceNumber,
      invoiceDate,
      billingParty,
      items,
      directEntry,
      billPhotos,
      note,
      discountPercentage,
    } = value;

    // Process each item to fetch product name and calculate values
    const updatedItems = await Promise.all(
      (items || []).map(async (item) => {
        // Fetch the product from the database
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found.`);
        }
        // Calculate rate excluding VAT (divide by 1.13)
        const rateExcludingVAT = parseFloat((product.mrp / 1.13).toFixed(2));
        const amount = parseFloat((rateExcludingVAT * item.quantity).toFixed(2));

        // Add product name and calculated values to the item
        return {
          ...item,
          name: product.name, // Add product name to the item
          rate: rateExcludingVAT, // Exclude VAT from rate
          amount: amount, // Calculate amount based on excluded VAT rate
        };
      })
    );

    // Calculate totals
    let subTotal = 0;
    if (updatedItems.length > 0) {
      subTotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    } else if (directEntry) {
      subTotal = directEntry.amount/1.13;
    }

    subTotal = parseFloat(subTotal.toFixed(2));

    const discountAmount = parseFloat(((subTotal * (discountPercentage / 100))).toFixed(2));
    const taxableAmount = parseFloat((subTotal - discountAmount).toFixed(2));
    const vatAmount = parseFloat((taxableAmount * 0.13).toFixed(2)); // Calculate VAT (13%)
    const grandTotal = parseFloat((taxableAmount + vatAmount).toFixed(2));

    // Create a new sale
    const sale = new Sales({
      invoiceNumber,
      invoiceDate,
      billingParty,
      items: updatedItems, // Use updated items with names
      directEntry: directEntry || {},
      billPhotos: billPhotos || [],
      note,
      discountPercentage,
      discountAmount,
      subTotal,
      taxableAmount,
      vatAmount,
      grandTotal,
      createdBy: req.user.id,
    });

    await sale.save(); // Save to database
    res.status(201).json({ message: "Sale created successfully", sale });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Update Sale
const updateSale = async (req, res) => {
  try {
    const { id } = req.params;

    // Use validateAsync() to handle asynchronous validation
    const value = await updateSaleSchema.validateAsync(req.body);

    // Check if the sale exists
    const sale = await Sales.findById(id);
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    // Update the sale
    Object.assign(sale, value, { updatedAt: Date.now() });

    // Save the updated sale
    await sale.save();
    res.status(200).json({ message: "Sale updated successfully", sale });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// View All Sales
const viewSales = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res
        .status(400)
        .json({ message: "Both 'from' and 'to' dates are required." });
    }

    const sales = await Sales.find({
      invoiceDate: { $gte: new Date(from), $lte: new Date(to) },
    })
      .populate("createdBy", "name") // Populate createdBy with the name field
      .sort({ invoiceDate: 1, invoiceNumber: 1 });

    // Replace billingParty IDs with their names where applicable
    const salesWithBillingPartyNames = await Promise.all(
      sales.map(async (sale) => {
        if (mongoose.Types.ObjectId.isValid(sale.billingParty)) {
          // If billingParty is an object ID, fetch the name
          const billingPartyDoc = await User.findById(sale.billingParty, "name");
          return {
            ...sale.toObject(),
            billingParty: billingPartyDoc ? billingPartyDoc.name : sale.billingParty,
          };
        }
        return sale.toObject(); // If it's already a string, return as is
      })
    );

    res.status(200).json({ sales: salesWithBillingPartyNames });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};


// Get Sale by ID
const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sales.findById(id)
      .populate("createdBy", "name");

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    // Check and handle billingParty
    let billingPartyName = sale.billingParty;
    if (mongoose.Types.ObjectId.isValid(sale.billingParty)) {
      // If billingParty is an object ID, fetch the name
      const billingPartyDoc = await User.findById(sale.billingParty, "name");
      billingPartyName = billingPartyDoc ? billingPartyDoc.name : sale.billingParty;
    }

    const saleWithBillingPartyName = {
      ...sale.toObject(),
      billingParty: billingPartyName,
    };

    res.status(200).json({ sale: saleWithBillingPartyName });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};


// Delete Sale
const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sales.findById(id);
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    await sale.deleteOne();
    res.status(200).json({ message: "Sale deleted successfully" });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};


module.exports = {
  createSale,
  updateSale,
  viewSales,
  getSaleById,
  deleteSale
};
