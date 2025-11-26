const Product = require("../models/Products");
const csvParser = require("csv-parser");
const fs = require("fs");
const path = require("path");
const { createProductSchema, updateProductSchema } = require("../validators/productsValidator");

// Create Product
const createProduct = async (req, res) => {
  try {
    // Validate the request body asynchronously
    const value = await createProductSchema.validateAsync(req.body);

    // Create the product
    const product = new Product({
      ...value,
      companyId: req.user.companyId, // Set companyId from authenticated user
    });
    await product.save();

    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Get Single Product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, companyId: req.user.companyId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ product });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Get All Products
const getAllProducts = async (req, res) => {
  try {
    const { category, sku } = req.query;
    const query = {
      companyId: req.user.companyId, // Filter by company
      ...(category ? { category: new RegExp(category, 'i') } : {}),
      ...(sku ? { sku } : {}),
    };

    const products = await Product.find(query).sort({ name: 1 });
    res.status(200).json({ products });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Update Product
const updateProduct = async (req, res) => {
  try {
    // Remove immutable fields if they exist in the request body
    const { _id, createdAt, updatedAt, __v, ...filteredRequest } = req.body;

    const value = await updateProductSchema.validateAsync(filteredRequest, {
      context: { id: req.params.id },
    });

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    Object.assign(product, value);
    await product.save();

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};


// Delete Product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, companyId: req.user.companyId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Bulk Upload Products from File
const uploadProductsByFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required." });
    }

    const addedProducts = [];
    const updatedProducts = [];
    const errors = [];
    const rows = [];
    const filePath = req.file.path;

    // Read the CSV File
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", async () => {
        try {
          for (const row of rows) {
            try {
              // Validate each row asynchronously
              const value = await createProductSchema.validateAsync({
                name: row.Name,
                mrp: parseFloat(row.MRP), // Allow integer or float
                sku: row.SKU,
                category: row.Category,
                thumbnailURL: row.ThumbnailURL,
                productURL: row.ProductURL,
              });

              // Check if a product with the same SKU already exists in the same company
              const existingProduct = await Product.findOne({ 
                sku: value.sku, 
                companyId: req.user.companyId 
              });

              if (existingProduct) {
                // Update the existing product if SKU is found
                await Product.updateOne(
                  { sku: value.sku, companyId: req.user.companyId }, // Find by SKU and company
                  {
                    $set: {
                      name: value.name,
                      mrp: value.mrp,
                      category: value.category,
                      thumbnailURL: value.thumbnailURL,
                      productURL: value.productURL,
                      updatedAt: Date.now(), // Update timestamp
                    },
                  }
                );
                updatedProducts.push(value); // Track updated products
              } else {
                // Create a new product if SKU doesn't exist
                const newProduct = new Product({
                  ...value,
                  companyId: req.user.companyId, // Set companyId from authenticated user
                });
                await newProduct.save();
                addedProducts.push(newProduct); // Track added products
              }
            } catch (err) {
              errors.push({ row, error: err.message }); // Track errors
            }
          }

          // Remove the file after processing
          fs.unlinkSync(filePath);

          // Response
          res.status(201).json({
            message: `${addedProducts.length} products added, ${updatedProducts.length} products updated successfully.`,
            addedProducts,
            updatedProducts,
            errors,
          });
        } catch (error) {
          res.status(500).json({ message: error.message });
        }
      });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

module.exports = {
  createProduct,
  getProductById,
  getAllProducts,
  updateProduct,
  deleteProduct,
  uploadProductsByFile,
};
