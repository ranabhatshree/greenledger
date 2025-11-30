const Import = require("../models/Import");
const {
  createImportSchema,
  updateImportSchema,
} = require("../validators/importValidator");
const path = require("path");
const fs = require("fs");

// Helper function to build file URL from file path
const buildFileUrl = (req, filename) => {
  if (!filename) return null;
  // If it's already a full URL, return as is
  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }
  // Build the URL using the static file serving path
  return `${req.protocol}://${req.get("host")}/uploads/imports/${filename}`;
};

// Create Import
const createImport = async (req, res, next) => {
  try {
    // Handle file uploads if any
    let billPhotos = [];
    if (req.files && req.files.length > 0) {
      billPhotos = req.files.map((file) => {
        return buildFileUrl(req, file.filename);
      });
    } else if (req.file) {
      // Single file upload
      billPhotos = [buildFileUrl(req, req.file.filename)];
    } else if (req.body.billPhotos) {
      // If billPhotos are passed as URLs in the body
      billPhotos = Array.isArray(req.body.billPhotos)
        ? req.body.billPhotos
        : [req.body.billPhotos];
    }

    // Parse expenseDetails if it's a JSON string (from FormData)
    let parsedExpenseDetails = req.body.expenseDetails;
    if (typeof parsedExpenseDetails === 'string') {
      try {
        parsedExpenseDetails = JSON.parse(parsedExpenseDetails);
      } catch (e) {
        // If parsing fails, keep as is
      }
    }

    // Strip _id fields from expenseDetails if present (Mongoose adds them automatically)
    if (parsedExpenseDetails && Array.isArray(parsedExpenseDetails)) {
      parsedExpenseDetails = parsedExpenseDetails.map(exp => ({
        title: exp.title,
        amount: exp.amount
      }));
    }

    // Merge file uploads with any URLs provided in body
    const bodyData = {
      ...req.body,
      billPhotos: billPhotos.length > 0 ? billPhotos : req.body.billPhotos || [],
      expenseDetails: parsedExpenseDetails,
    };

    // Validate the data
    const validatedData = await createImportSchema.validateAsync(bodyData);

    // Check for duplicate invoice number within the same company
    const existingImport = await Import.findOne({
      invoiceNumber: validatedData.invoiceNumber,
      companyId: req.user.companyId,
    });

    if (existingImport) {
      // Clean up uploaded files if duplicate found
      if (req.files || req.file) {
        const filesToDelete = req.files || [req.file];
        filesToDelete.forEach((file) => {
          const filePath = path.join("uploads", "imports", file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      return res.status(400).json({
        message: "Invoice number already exists for this company",
      });
    }

    // Create a new import document
    const importRecord = new Import({
      ...validatedData,
      companyId: req.user.companyId,
      createdBy: req.user.id,
    });

    await importRecord.save();

    // Populate references for response
    await importRecord.populate("createdBy", "name email");
    await importRecord.populate("companyId", "name");

    res.status(201).json({
      message: "Import created successfully",
      import: importRecord,
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files || req.file) {
      const filesToDelete = req.files || [req.file];
      filesToDelete.forEach((file) => {
        const filePath = path.join("uploads", "imports", file.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error("Error deleting file:", err);
          }
        }
      });
    }
    next(error);
  }
};

// Get All Imports (with pagination and filters)
const getAllImports = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      from,
      to,
      invoiceNumber,
      supplierName,
    } = req.query;

    const query = { companyId: req.user.companyId };

    // Date range filter
    if (from || to) {
      query.invoiceDate = {};
      if (from) query.invoiceDate.$gte = new Date(from);
      if (to) query.invoiceDate.$lte = new Date(to);
    }

    // Invoice number filter
    if (invoiceNumber) {
      query.invoiceNumber = { $regex: invoiceNumber, $options: "i" };
    }

    // Supplier name filter
    if (supplierName) {
      query.supplierName = { $regex: supplierName, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const imports = await Import.find(query)
      .populate("createdBy", "name email")
      .populate("companyId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Import.countDocuments(query);

    res.status(200).json({
      imports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Import by ID
const getImportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const importRecord = await Import.findOne({
      _id: id,
      companyId: req.user.companyId,
    })
      .populate("createdBy", "name email")
      .populate("companyId", "name");

    if (!importRecord) {
      return res.status(404).json({ message: "Import not found" });
    }

    res.status(200).json({ import: importRecord });
  } catch (error) {
    next(error);
  }
};

// Update Import
const updateImport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const importRecord = await Import.findOne({
      _id: id,
      companyId: req.user.companyId,
    });

    if (!importRecord) {
      return res.status(404).json({ message: "Import not found" });
    }

    // Handle file uploads if any
    let newBillPhotos = [];
    if (req.files && req.files.length > 0) {
      newBillPhotos = req.files.map((file) => {
        return buildFileUrl(req, file.filename);
      });
    } else if (req.file) {
      newBillPhotos = [buildFileUrl(req, req.file.filename)];
    }

    // Merge new uploads with existing or body-provided photos
    let billPhotos = importRecord.billPhotos || [];
    if (newBillPhotos.length > 0) {
      billPhotos = [...billPhotos, ...newBillPhotos];
    } else if (req.body.billPhotos !== undefined) {
      // If billPhotos are explicitly provided in body, use them
      billPhotos = Array.isArray(req.body.billPhotos)
        ? req.body.billPhotos
        : [req.body.billPhotos];
    }

    // Parse expenseDetails if it's a JSON string (from FormData)
    let parsedExpenseDetails = req.body.expenseDetails;
    if (typeof parsedExpenseDetails === 'string') {
      try {
        parsedExpenseDetails = JSON.parse(parsedExpenseDetails);
      } catch (e) {
        // If parsing fails, keep as is
      }
    }

    // Strip _id fields from expenseDetails if present (Mongoose adds them automatically)
    if (parsedExpenseDetails && Array.isArray(parsedExpenseDetails)) {
      parsedExpenseDetails = parsedExpenseDetails.map(exp => ({
        title: exp.title,
        amount: exp.amount
      }));
    }

    const bodyData = {
      ...req.body,
      billPhotos: billPhotos,
      expenseDetails: parsedExpenseDetails,
    };

    // Validate the data
    const { error, value } = updateImportSchema.validate(bodyData);
    if (error) {
      // Clean up uploaded files on validation error
      if (req.files || req.file) {
        const filesToDelete = req.files || [req.file];
        filesToDelete.forEach((file) => {
          const filePath = path.join("uploads", "imports", file.filename);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (err) {
              console.error("Error deleting file:", err);
            }
          }
        });
      }
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check for duplicate invoice number if invoiceNumber is being updated
    if (value.invoiceNumber && value.invoiceNumber !== importRecord.invoiceNumber) {
      const existingImport = await Import.findOne({
        invoiceNumber: value.invoiceNumber,
        companyId: req.user.companyId,
        _id: { $ne: id },
      });

      if (existingImport) {
        // Clean up uploaded files if duplicate found
        if (req.files || req.file) {
          const filesToDelete = req.files || [req.file];
          filesToDelete.forEach((file) => {
            const filePath = path.join("uploads", "imports", file.filename);
            if (fs.existsSync(filePath)) {
              try {
                fs.unlinkSync(filePath);
              } catch (err) {
                console.error("Error deleting file:", err);
              }
            }
          });
        }
        return res.status(400).json({
          message: "Invoice number already exists for this company",
        });
      }
    }

    // Update the import record
    Object.assign(importRecord, value, { updatedAt: Date.now() });
    await importRecord.save();

    // Populate references for response
    await importRecord.populate("createdBy", "name email");
    await importRecord.populate("companyId", "name");

    res.status(200).json({
      message: "Import updated successfully",
      import: importRecord,
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files || req.file) {
      const filesToDelete = req.files || [req.file];
      filesToDelete.forEach((file) => {
        const filePath = path.join("uploads", "imports", file.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error("Error deleting file:", err);
          }
        }
      });
    }
    next(error);
  }
};

// Delete Import
const deleteImport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const importRecord = await Import.findOne({
      _id: id,
      companyId: req.user.companyId,
    });

    if (!importRecord) {
      return res.status(404).json({ message: "Import not found" });
    }

    // Delete associated files
    if (importRecord.billPhotos && importRecord.billPhotos.length > 0) {
      importRecord.billPhotos.forEach((photoUrl) => {
        try {
          // Extract filename from URL (handles both full URLs and relative paths)
          let filename;
          if (photoUrl.includes("/uploads/imports/")) {
            // Extract filename from path like /uploads/imports/filename.jpg or http://host/uploads/imports/filename.jpg
            const parts = photoUrl.split("/uploads/imports/");
            filename = parts[parts.length - 1];
          } else {
            // Fallback: just get the last part of the URL
            const urlParts = photoUrl.split("/");
            filename = urlParts[urlParts.length - 1];
          }
          
          if (filename) {
            const filePath = path.join("uploads", "imports", filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      });
    }

    await importRecord.deleteOne();
    res.status(200).json({ message: "Import deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createImport,
  getAllImports,
  getImportById,
  updateImport,
  deleteImport,
};

