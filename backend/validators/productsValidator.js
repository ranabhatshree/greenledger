const Joi = require('joi');

// Create Product Validation Schema
const createProductSchema = Joi.object({
    name: Joi.string().required().messages({
        'any.required': 'Product name is required',
        'string.base': 'Product name must be a string',
    }),
    mrp: Joi.number().positive().required().messages({
        'any.required': 'MRP is required',
        'number.positive': 'MRP must be a positive number',
        'number.base': 'MRP must be a valid number',
    }),
    sku: Joi.string().required().messages({
        'any.required': 'SKU is required',
        'string.base': 'SKU must be a string',
    }), // No uniqueness check for SKU
    category: Joi.string().required().messages({
        'any.required': 'Category is required',
        'string.base': 'Category must be a string',
    }),
    thumbnailURL: Joi.string().uri().required().messages({
        'any.required': 'Thumbnail URL is required',
        'string.uri': 'Thumbnail URL must be a valid URL',
        'string.base': 'Thumbnail URL must be a string',
    }),
    productURL: Joi.string().uri().required().messages({
        'any.required': 'Product URL is required',
        'string.uri': 'Product URL must be a valid URL',
        'string.base': 'Product URL must be a string',
    }),
});

// Update Product Validation Schema
const updateProductSchema = Joi.object({
    name: Joi.string().optional().messages({
        'string.base': 'Product name must be a string',
    }),
    mrp: Joi.number().positive().optional().messages({
        'number.positive': 'MRP must be a positive number',
        'number.base': 'MRP must be a valid number',
    }),
    sku: Joi.string().optional().messages({
        'string.base': 'SKU must be a string',
    }), // No uniqueness check for SKU
    category: Joi.string().optional().messages({
        'string.base': 'Category must be a string',
    }),
    thumbnailURL: Joi.string().uri().optional().messages({
        'string.uri': 'Thumbnail URL must be a valid URL',
        'string.base': 'Thumbnail URL must be a string',
    }),
    productURL: Joi.string().uri().optional().messages({
        'string.uri': 'Product URL must be a valid URL',
        'string.base': 'Product URL must be a string',
    }),
});

module.exports = { createProductSchema, updateProductSchema };
