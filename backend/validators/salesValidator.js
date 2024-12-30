const Joi = require('joi');
const mongoose = require('mongoose');
const Product = require('../models/Products'); // Import the Product model

// Valid image extensions
const validImageExtensions = /\.(jpg|jpeg|png|gif)$/i;

// Custom validator to check if productId exists in the Products collection
const isValidProductId = async (value, helpers) => {
    // Check if value is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid product ID format.');
    }

    // Check if product exists in the database
    const product = await Product.findById(value);
    if (!product) {
        return helpers.message('Product with the given ID does not exist.');
    }

    return value; // Valid productId
};

// Create Sale Validation Schema
const createSaleSchema = Joi.object({
    invoiceNumber: Joi.string().required().messages({
        'any.required': 'Invoice number is required',
        'string.base': 'Invoice number must be a string',
    }),
    invoiceDate: Joi.date().required().messages({
        'any.required': 'Invoice date is required',
        'date.base': 'Invoice date must be a valid date',
    }),
    billingParty: Joi.alternatives()
        .try(Joi.string(), Joi.object())
        .required()
        .messages({
            'any.required': 'Billing party is required',
        }),
    items: Joi.array()
        .items(
            Joi.object({
                productId: Joi.string()
                    .required()
                    .external(isValidProductId) // External async validation
                    .messages({
                        'any.required': 'Product ID is required',
                        'string.base': 'Product ID must be a valid string',
                    }),
                quantity: Joi.number().positive().required().messages({
                    'number.positive': 'Quantity must be a positive number',
                    'any.required': 'Quantity is required',
                })
            })
        )
        .optional(),
    directEntry: Joi.object({
        description: Joi.string().required().messages({
            'any.required': 'Description is required',
            'string.base': 'Description must be a string',
        }),
        amount: Joi.number().positive().required().messages({
            'number.positive': 'Amount must be a positive number',
            'any.required': 'Amount is required',
        }),
    }).optional(),
    discountPercentage: Joi.number().min(0).max(100).default(0).messages({
        'number.min': 'Discount percentage must be at least 0%',
        'number.max': 'Discount percentage cannot exceed 100%',
    }),
    billPhotos: Joi.array()
        .items(Joi.string().uri().regex(validImageExtensions).messages({
            'string.base': 'Each bill photo must be a string',
            'string.uri': 'Each bill photo must be a valid URL',
            'string.pattern.base': 'Each bill photo must be a valid image URL (jpg, jpeg, png, gif)',
        }))
        .max(5)
        .optional()
        .allow(null)
        .messages({
            'array.max': 'You can upload a maximum of 5 photos',
        }),
    note: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Note must be a string',
    })
}).custom((value, helpers) => {
    // Custom validation to ensure either 'items' or 'directEntry' is provided, but not both
    const hasItems = value.items && value.items.length > 0;
    const hasDirectEntry = value.directEntry && value.directEntry.description;

    if ((hasItems && hasDirectEntry) || (!hasItems && !hasDirectEntry)) {
        return helpers.message('Either add items or provide a direct entry, not both.');
    }

    return value;
});

// Update Sale Validation Schema
const updateSaleSchema = createSaleSchema.fork(
    ['invoiceNumber', 'invoiceDate', 'billingParty'], 
    (schema) => schema.optional()
);

module.exports = { createSaleSchema, updateSaleSchema };
