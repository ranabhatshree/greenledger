const Sales = require("../models/Sales");
const User = require("../models/User");
const Party = require("../models/Party");
const {
  createSaleSchema,
  updateSaleSchema,
} = require("../validators/salesValidator");
const Product = require("../models/Products");
const mongoose = require("mongoose")

// Create Sale
const createSale = async (req, res, next) => {
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

    // Validate that billingParty belongs to the same company
    const party = await Party.findOne({ 
      _id: billingParty, 
      companyId: req.user.companyId 
    });
    if (!party) {
      return res.status(404).json({ message: 'Billing party not found or does not belong to your company' });
    }

    // Process each item to fetch product name and calculate values
    const updatedItems = await Promise.all(
      (items || []).map(async (item) => {
        // Fetch the product from the database (must belong to same company)
        const product = await Product.findOne({ 
          _id: item.productId, 
          companyId: req.user.companyId 
        });
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
      companyId: req.user.companyId, // Set companyId from authenticated user
      createdBy: req.user.id,
    });

    await sale.save(); // Save to database
    res.status(201).json({ message: "Sale created successfully", sale });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Update Sale
const updateSale = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Use validateAsync() to handle asynchronous validation
    const value = await updateSaleSchema.validateAsync(req.body);

    // Check if the sale exists and belongs to the same company
    const sale = await Sales.findOne({ _id: id, companyId: req.user.companyId });
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const {
      invoiceNumber,
      invoiceDate,
      billingParty,
      items,
      directEntry,
      billPhotos,
      note,
      discountPercentage,
      grandTotal: providedGrandTotal, // Extract grandTotal if provided
    } = value;

    // Validate billingParty if it's being updated
    if (billingParty && billingParty.toString() !== sale.billingParty.toString()) {
      const party = await Party.findOne({ 
        _id: billingParty, 
        companyId: req.user.companyId 
      });
      if (!party) {
        return res.status(404).json({ message: 'Billing party not found or does not belong to your company' });
      }
    }

    // Save original values for logging changes
    const originalSale = {
      invoiceNumber: sale.invoiceNumber,
      invoiceDate: sale.invoiceDate,
      billingParty: sale.billingParty,
      items: [...sale.items],
      directEntry: sale.directEntry ? { ...sale.directEntry } : null,
      billPhotos: [...sale.billPhotos],
      note: sale.note,
      discountPercentage: sale.discountPercentage,
      grandTotal: sale.grandTotal
    };

    // Check if this is a direct entry sale (no items) or an items-based sale
    const isItemsBasedSale = sale.items && sale.items.length > 0;
    const isDirectEntrySale = !isItemsBasedSale;
    
    // Determine update type
    const isItemsUpdate = items && items.length > 0;
    const isDirectEntryUpdate = (isDirectEntrySale || !isItemsUpdate) && (directEntry || providedGrandTotal);
    
    let updatedItems = sale.items;
    let subTotal = sale.subTotal;
    let discPercentage = discountPercentage || sale.discountPercentage || 0;
    let discountAmount = sale.discountAmount;
    let taxableAmount = sale.taxableAmount;
    let vatAmount = sale.vatAmount;
    let grandTotal = sale.grandTotal;
    let updatedDirectEntry = sale.directEntry || {};


    // CASE 1: Items update
    if (isItemsUpdate) {
      updatedItems = await Promise.all(
        items.map(async (item) => {
          // Fetch the product from the database (must belong to same company)
          const product = await Product.findOne({ 
            _id: item.productId, 
            companyId: req.user.companyId 
          });
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
      
      // Calculate totals from items
      subTotal = parseFloat(updatedItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2));
      discountAmount = parseFloat(((subTotal * (discPercentage / 100))).toFixed(2));
      taxableAmount = parseFloat((subTotal - discountAmount).toFixed(2));
      vatAmount = parseFloat((taxableAmount * 0.13).toFixed(2)); // Calculate VAT (13%)
      grandTotal = parseFloat((taxableAmount + vatAmount).toFixed(2));
    } 
    // CASE 2: Direct Entry update
    else if (isDirectEntryUpdate) {

      // Use provided grandTotal if available
      if (providedGrandTotal) {
        grandTotal = parseFloat(providedGrandTotal);
        
        // Calculate backward from grandTotal
        // Assuming VAT is 13% and using the formula: grandTotal = taxableAmount * 1.13
        taxableAmount = parseFloat((grandTotal / 1.13).toFixed(2));
        vatAmount = parseFloat((grandTotal - taxableAmount).toFixed(2));
        
        // For direct entry with provided grandTotal, reset discount
        discountAmount = 0;
        subTotal = taxableAmount; // For direct entry, subTotal equals taxableAmount (no discount)
        
        // Update the directEntry object
        updatedDirectEntry = {
          ...updatedDirectEntry,
          amount: grandTotal,
          description: directEntry?.description || updatedDirectEntry.description || "Direct Entry"
        };
      } 
      // Otherwise use the directEntry.amount if provided
      else if (directEntry && directEntry.amount) {
        const entryAmount = parseFloat(directEntry.amount);
        
        subTotal = parseFloat((entryAmount / 1.13).toFixed(2));
        discountAmount = parseFloat(((subTotal * (discPercentage / 100))).toFixed(2));
        taxableAmount = parseFloat((subTotal - discountAmount).toFixed(2));
        vatAmount = parseFloat((taxableAmount * 0.13).toFixed(2));
        grandTotal = parseFloat((taxableAmount + vatAmount).toFixed(2));
        
        // Update the directEntry object
        updatedDirectEntry = {
          ...updatedDirectEntry,
          ...directEntry
        };
      }
    }

    // Prepare update object with appropriate fields
    const updateData = {
      invoiceNumber: invoiceNumber || sale.invoiceNumber,
      invoiceDate: invoiceDate || sale.invoiceDate,
      billingParty: billingParty || sale.billingParty,
      items: isItemsUpdate ? updatedItems : sale.items,
      directEntry: isDirectEntryUpdate ? updatedDirectEntry : sale.directEntry,
      billPhotos: billPhotos || sale.billPhotos || [],
      note: note !== undefined ? note : sale.note,
      discountPercentage: discPercentage,
      discountAmount,
      subTotal,
      taxableAmount,
      vatAmount,
      grandTotal,
      updatedAt: Date.now()
    };

    // Generate edit history log
    const editLog = await generateEditHistoryLog(req.user, originalSale, updateData);
    
    // Check if any changes were actually made
    if (!editLog) {
      return res.status(200).json({ 
        message: "No changes detected", 
        sale: sale 
      });
    }
    
    // Add new log to the existing logs array
    if (!sale.editHistoryLogs) {
      sale.editHistoryLogs = [];
    }
    sale.editHistoryLogs.push(editLog);

    // Update the sale
    Object.assign(sale, updateData);

    // Save the updated sale
    await sale.save();
    res.status(200).json({ message: "Sale updated successfully", sale });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Helper function to generate edit history log
const generateEditHistoryLog = async (user, originalSale, updatedSale) => {
  try {
    // Get user information
    const editor = await User.findById(user.id);
    if (!editor) {
      return null;
    }

    const changedFields = [];

    // Check basic fields
    if (originalSale.invoiceNumber !== updatedSale.invoiceNumber) {
      changedFields.push(`Invoice Number from ${originalSale.invoiceNumber} to ${updatedSale.invoiceNumber}`);
    }

    if (originalSale.invoiceDate && updatedSale.invoiceDate && 
        new Date(originalSale.invoiceDate).toISOString() !== new Date(updatedSale.invoiceDate).toISOString()) {
      changedFields.push(`Invoice Date from ${new Date(originalSale.invoiceDate).toLocaleDateString()} to ${new Date(updatedSale.invoiceDate).toLocaleDateString()}`);
    }

    // If billingParty has changed and is an ObjectId, try to get the name
    if (originalSale.billingParty !== updatedSale.billingParty) {
      let originalName = originalSale.billingParty;
      let updatedName = updatedSale.billingParty;

      if (mongoose.Types.ObjectId.isValid(originalSale.billingParty)) {
        const originalParty = await Party.findById(originalSale.billingParty, "name");
        if (originalParty) originalName = originalParty.name;
      }

      if (mongoose.Types.ObjectId.isValid(updatedSale.billingParty)) {
        const updatedParty = await Party.findById(updatedSale.billingParty, "name");
        if (updatedParty) updatedName = updatedParty.name;
      }

      changedFields.push(`Billing Party from ${originalName} to ${updatedName}`);
    }

    // Check if items have changed (simplified - just check count)
    if (originalSale.items.length !== updatedSale.items.length) {
      changedFields.push(`Items list (count changed from ${originalSale.items.length} to ${updatedSale.items.length})`);
    }

    // Check directEntry changes
    if (
      (originalSale.directEntry && !updatedSale.directEntry) ||
      (!originalSale.directEntry && updatedSale.directEntry) ||
      (originalSale.directEntry && updatedSale.directEntry && 
        originalSale.directEntry.amount !== updatedSale.directEntry.amount)
    ) {
      const originalAmount = originalSale.directEntry ? originalSale.directEntry.amount : 0;
      const updatedAmount = updatedSale.directEntry ? updatedSale.directEntry.amount : 0;
      changedFields.push(`Direct Entry Amount from ${originalAmount} to ${updatedAmount}`);
    }

    // Check note changes
    if (originalSale.note !== updatedSale.note) {
      changedFields.push("Note");
    }

    // Check discount percentage changes
    if (originalSale.discountPercentage !== updatedSale.discountPercentage) {
      changedFields.push(`Discount Percentage from ${originalSale.discountPercentage}% to ${updatedSale.discountPercentage}%`);
    }

    // Check grand total changes
    if (originalSale.grandTotal !== updatedSale.grandTotal) {
      changedFields.push(`Grand Total from ${originalSale.grandTotal} to ${updatedSale.grandTotal}`);
    }

    // Check if bill photos changed
    if (originalSale.billPhotos.length !== updatedSale.billPhotos.length) {
      changedFields.push(`Bill Photos (count changed from ${originalSale.billPhotos.length} to ${updatedSale.billPhotos.length})`);
    }

    // If no changes detected, return null
    if (changedFields.length === 0) {
      return null;
    }

    // Construct the log message
    const description = `${editor.name} has changed ${changedFields.join(", ")}`;

    return {
      description,
      editedBy: user.id,
      editedAt: new Date()
    };
  } catch (error) {
    console.error("Error generating edit history log:", error);
    return null;
  }
};

// View All Sales
const viewSales = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res
        .status(400)
        .json({ message: "Both 'from' and 'to' dates are required." });
    }

    const sales = await Sales.find({
      companyId: req.user.companyId, // Filter by company
      invoiceDate: { $gte: new Date(from), $lte: new Date(to) },
    })
      .populate("createdBy", "name") // Populate createdBy with the name field
      .populate("billingParty", "name") // Populate billingParty with Party name
      .sort({ invoiceDate: 1, invoiceNumber: 1 });

    // Process sales and handle billingParty
    const salesWithBillingPartyNames = sales.map((sale) => {
      const saleObj = sale.toObject();
      
      // Sort editHistoryLogs in descending order (newest first)
      if (saleObj.editHistoryLogs && saleObj.editHistoryLogs.length > 0) {
        saleObj.editHistoryLogs.sort((a, b) => new Date(b.editedAt) - new Date(a.editedAt));
      }
      
      // billingParty is already populated, but handle edge cases
      if (saleObj.billingParty && typeof saleObj.billingParty === 'object') {
        saleObj.billingParty = saleObj.billingParty.name || saleObj.billingParty;
      }
      
      return saleObj;
    });

    res.status(200).json({ sales: salesWithBillingPartyNames });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};


// Get Sale by ID
const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sale = await Sales.findOne({ 
      _id: id, 
      companyId: req.user.companyId 
    })
      .populate("createdBy", "name")
      .populate("billingParty", "name phone email");

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    // Convert to object for manipulation
    const saleObj = sale.toObject();
    
    // Sort editHistoryLogs in descending order (newest first)
    if (saleObj.editHistoryLogs && saleObj.editHistoryLogs.length > 0) {
      saleObj.editHistoryLogs.sort((a, b) => new Date(b.editedAt) - new Date(a.editedAt));
    }

    // Populate billingParty if it's an ObjectId
    if (sale.billingParty && typeof sale.billingParty === 'object') {
      saleObj.billingParty = sale.billingParty.name || saleObj.billingParty;
    } else if (mongoose.Types.ObjectId.isValid(saleObj.billingParty)) {
      // Fallback: if not populated, fetch Party name
      const billingPartyDoc = await Party.findById(saleObj.billingParty, "name");
      saleObj.billingParty = billingPartyDoc ? billingPartyDoc.name : saleObj.billingParty;
    }

    const saleWithBillingPartyName = saleObj;

    res.status(200).json({ sale: saleWithBillingPartyName });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};


// Delete Sale
const deleteSale = async (req, res, next) => {
  try {
    const { id } = req.params;

    const sale = await Sales.findOne({ _id: id, companyId: req.user.companyId });
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
