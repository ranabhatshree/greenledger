const Joi = require("joi");

// Valid image extensions
const validImageExtensions = /\.(jpg|jpeg|png|gif)$/i;

// Create Purchase Validation Schema
const createPurchaseSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    "any.required": "Amount is required",
    "number.positive": "Amount must be a positive number",
    "number.base": "Amount must be a valid number",
  }),
  invoiceNumber: Joi.string().required().messages({
    "any.required": "Invoice number is required",
    "string.base": "Invoice number must be a string",
  }),
  isVatable: Joi.boolean().optional().messages({
    "boolean.base": "Is Vatable must be a boolean",
  }),
  suppliedBy: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "Supplied By (Party ID) is required",
      "string.pattern.base": "Supplied By must be a valid Party ObjectId",
    }),
  description: Joi.string().required().messages({
    "any.required": "Description is required",
    "string.base": "Description must be a string",
  }),
  invoiceDate: Joi.date().required().messages({
    "any.required": "Invoice date is required",
    "date.base": "Invoice date must be a valid date",
  }),
  billPhotos: Joi.array()
    .items(
      Joi.string().uri().regex(validImageExtensions).messages({
        "string.base": "Each bill photo must be a string",
        "string.uri": "Each bill photo must be a valid URL",
        "string.pattern.base":
          "Each bill photo must be a valid image URL (jpg, jpeg, png, gif)",
      })
    )
    .max(5)
    .optional()
    .allow(null)
    .messages({
      "array.max": "You can upload a maximum of 5 photos",
    }),
  note: Joi.string().optional().allow(null, "").messages({
    "string.base": "Note must be a string",
  }),
});

// Update Purchase Validation Schema
const updatePurchaseSchema = Joi.object({
  amount: Joi.number().positive().optional().messages({
    "number.positive": "Amount must be a positive number",
    "number.base": "Amount must be a valid number",
  }),
  invoiceNumber: Joi.string().optional().messages({
    "string.base": "Invoice number must be a string",
  }),
  isVatable: Joi.boolean().optional().messages({
    "boolean.base": "Is Vatable must be a boolean",
  }),
  suppliedBy: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Supplied By must be a valid Party ObjectId",
    }),
  description: Joi.string().optional().messages({
    "string.base": "Description must be a string",
  }),
  invoiceDate: Joi.date().required().messages({
    "any.required": "Invoice date is required",
    "date.base": "Invoice date must be a valid date",
  }),
  billPhotos: Joi.array()
    .items(
      Joi.string().uri().regex(validImageExtensions).messages({
        "string.base": "Each bill photo must be a string",
        "string.uri": "Each bill photo must be a valid URL",
        "string.pattern.base":
          "Each bill photo must be a valid image URL (jpg, jpeg, png, gif)",
      })
    )
    .max(5)
    .optional()
    .allow(null)
    .messages({
      "array.max": "You can upload a maximum of 5 photos",
    }),
  note: Joi.string().optional().allow(null, "").messages({
    "string.base": "Note must be a string",
  }),
});

module.exports = { createPurchaseSchema, updatePurchaseSchema };
