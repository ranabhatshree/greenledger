const Joi = require('joi');

// Create Expense Category Validation Schema
const createCategorySchema = Joi.object({
    name: Joi.string().required().messages({
        'any.required': 'Category name is required',
        'string.base': 'Category name must be a string',
    }),
    description: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Description must be a string',
    }),
    isActive: Joi.boolean().optional().messages({
        'boolean.base': 'IsActive must be a boolean value',
    }),
});

// Update Expense Category Validation Schema
const updateCategorySchema = Joi.object({
    name: Joi.string().optional().messages({
        'string.base': 'Category name must be a string',
    }),
    description: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Description must be a string',
    }),
    isActive: Joi.boolean().optional().messages({
        'boolean.base': 'IsActive must be a boolean value',
    }),
});

module.exports = { createCategorySchema, updateCategorySchema };
