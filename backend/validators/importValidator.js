const Joi = require("joi");

// Valid image extensions
const validImageExtensions = /\.(jpg|jpeg|png|gif|pdf)$/i;

// Create Import Validation Schema
const createImportSchema = Joi.object({
  invoiceNumber: Joi.string().required().messages({
    "any.required": "Invoice number is required",
    "string.base": "Invoice number must be a string",
  }),
  amountUSD: Joi.number().positive().required().messages({
    "any.required": "Amount in USD is required",
    "number.positive": "Amount in USD must be a positive number",
    "number.base": "Amount in USD must be a valid number",
  }),
  amount: Joi.number().positive().required().messages({
    "any.required": "Amount is required",
    "number.positive": "Amount must be a positive number",
    "number.base": "Amount must be a valid number",
  }),
  invoiceDate: Joi.date().required().messages({
    "any.required": "Invoice date is required",
    "date.base": "Invoice date must be a valid date",
  }),
  supplierName: Joi.string().required().messages({
    "any.required": "Supplier name is required",
    "string.base": "Supplier name must be a string",
  }),
  supplierAddress: Joi.string().required().messages({
    "any.required": "Supplier address is required",
    "string.base": "Supplier address must be a string",
  }),
  description: Joi.string().required().messages({
    "any.required": "Description is required",
    "string.base": "Description must be a string",
  }),
  billPhotos: Joi.array()
    .items(
      Joi.string().messages({
        "string.base": "Each bill photo must be a string (URL or file path)",
      })
    )
    .max(10)
    .optional()
    .allow(null)
    .messages({
      "array.max": "You can upload a maximum of 10 photos",
    }),
  driveLink: Joi.string().uri().optional().allow(null, "").messages({
    "string.base": "Drive link must be a string",
    "string.uri": "Drive link must be a valid URL",
  }),
  note: Joi.string().optional().allow(null, "").messages({
    "string.base": "Note must be a string",
  }),
  expenseDetails: Joi.array()
    .items(
      Joi.object({
        _id: Joi.any().optional(), // Allow _id if present (from MongoDB)
        title: Joi.string().required().messages({
          "any.required": "Expense title is required",
          "string.base": "Expense title must be a string",
          "string.empty": "Expense title cannot be empty",
        }),
        amount: Joi.number().min(0).required().messages({
          "any.required": "Expense amount is required",
          "number.base": "Expense amount must be a number",
          "number.min": "Expense amount must be non-negative",
        }),
      }).unknown(false) // Don't allow other unknown fields
    )
    .optional()
    .allow(null)
    .messages({
      "array.base": "Expense details must be an array",
    }),
}).custom((value, helpers) => {
  // Custom validation: either billPhotos or driveLink must be present
  const hasBillPhotos = value.billPhotos && value.billPhotos.length > 0;
  const hasDriveLink = value.driveLink && value.driveLink.trim() !== '';
  
  if (!hasBillPhotos && !hasDriveLink) {
    return helpers.error('any.custom', {
      message: 'Either billPhotos or driveLink must be provided'
    });
  }
  
  // Validate expenseDetails: check for duplicate titles
  if (value.expenseDetails && value.expenseDetails.length > 0) {
    const titles = value.expenseDetails
      .map(exp => exp.title?.trim().toLowerCase())
      .filter(Boolean);
    const uniqueTitles = new Set(titles);
    
    if (titles.length !== uniqueTitles.size) {
      return helpers.error('any.custom', {
        message: 'Duplicate expense titles are not allowed. Each expense must have a unique title.'
      });
    }
  }
  
  return value;
});

// Update Import Validation Schema
const updateImportSchema = Joi.object({
  invoiceNumber: Joi.string().optional().messages({
    "string.base": "Invoice number must be a string",
  }),
  amountUSD: Joi.number().positive().optional().messages({
    "number.positive": "Amount in USD must be a positive number",
    "number.base": "Amount in USD must be a valid number",
  }),
  amount: Joi.number().positive().optional().messages({
    "number.positive": "Amount must be a positive number",
    "number.base": "Amount must be a valid number",
  }),
  invoiceDate: Joi.date().optional().messages({
    "date.base": "Invoice date must be a valid date",
  }),
  supplierName: Joi.string().optional().messages({
    "string.base": "Supplier name must be a string",
  }),
  supplierAddress: Joi.string().optional().messages({
    "string.base": "Supplier address must be a string",
  }),
  description: Joi.string().optional().messages({
    "string.base": "Description must be a string",
  }),
  billPhotos: Joi.array()
    .items(
      Joi.string().messages({
        "string.base": "Each bill photo must be a string (URL or file path)",
      })
    )
    .max(10)
    .optional()
    .allow(null)
    .messages({
      "array.max": "You can upload a maximum of 10 photos",
    }),
  driveLink: Joi.string().uri().optional().allow(null, "").messages({
    "string.base": "Drive link must be a string",
    "string.uri": "Drive link must be a valid URL",
  }),
  note: Joi.string().optional().allow(null, "").messages({
    "string.base": "Note must be a string",
  }),
  expenseDetails: Joi.array()
    .items(
      Joi.object({
        _id: Joi.any().optional(), // Allow _id if present (from MongoDB)
        title: Joi.string().required().messages({
          "any.required": "Expense title is required",
          "string.base": "Expense title must be a string",
          "string.empty": "Expense title cannot be empty",
        }),
        amount: Joi.number().min(0).required().messages({
          "any.required": "Expense amount is required",
          "number.base": "Expense amount must be a number",
          "number.min": "Expense amount must be non-negative",
        }),
      }).unknown(false) // Don't allow other unknown fields
    )
    .optional()
    .allow(null)
    .messages({
      "array.base": "Expense details must be an array",
    }),
}).custom((value, helpers) => {
  // Validate expenseDetails: check for duplicate titles
  if (value.expenseDetails && value.expenseDetails.length > 0) {
    const titles = value.expenseDetails
      .map(exp => exp.title?.trim().toLowerCase())
      .filter(Boolean);
    const uniqueTitles = new Set(titles);
    
    if (titles.length !== uniqueTitles.size) {
      return helpers.error('any.custom', {
        message: 'Duplicate expense titles are not allowed. Each expense must have a unique title.'
      });
    }
  }
  
  return value;
});
// Note: The model's pre-save hook will validate that either billPhotos or driveLink is present

module.exports = { createImportSchema, updateImportSchema };

