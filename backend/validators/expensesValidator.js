const Joi = require('joi');

// Define a regex for MongoDB ObjectId validation
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Create Expense Validation Schema
const createExpenseSchema = Joi.object({
    amount: Joi.number().positive().required().messages({
        'any.required': 'Amount is required',
        'number.positive': 'Amount must be a positive number',
        'number.base': 'Amount must be a valid number',
    }),
    invoiceNumber: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Invoice number must be a string',
    }),
    category: Joi.string()
        .pattern(objectIdRegex)
        .required()
        .messages({
            'any.required': 'Category is required',
            'string.pattern.base': 'Category must be a valid ObjectId',
        }),
    description: Joi.string().required().messages({
        'any.required': 'Description is required',
        'string.base': 'Description must be a string',
    }),
    billPhotos: Joi.array()
        .items(Joi.string().uri().messages({
            'string.base': 'Each bill photo must be a string',
            'string.uri': 'Each bill photo must be a valid URL',
        }))
        .max(5)
        .optional()
        .allow(null)
        .messages({
            'array.base': 'Bill photos must be an array',
            'array.max': 'A maximum of 5 bill photos are allowed',
        }),
    invoiceDate: Joi.date().required().messages({
        'any.required': 'Invoice date is required',
        'date.base': 'Invoice date must be a valid date',
    }),
    isVatable: Joi.boolean().optional().default(false).messages({
        'boolean.base': 'isVatable must be a boolean value',
    }),
});

// Update Expense Validation Schema
const updateExpenseSchema = Joi.object({
    amount: Joi.number().positive().optional().messages({
        'number.positive': 'Amount must be a positive number',
        'number.base': 'Amount must be a valid number',
    }),
    invoiceNumber: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Invoice number must be a string',
    }),
    category: Joi.string()
        .pattern(objectIdRegex)
        .optional()
        .messages({
            'string.pattern.base': 'Category must be a valid ObjectId',
        }),
    description: Joi.string().optional().messages({
        'string.base': 'Description must be a string',
    }),
    billPhotos: Joi.array()
        .items(Joi.string().uri().messages({
            'string.base': 'Each bill photo must be a string',
            'string.uri': 'Each bill photo must be a valid URL',
        }))
        .max(5)
        .optional()
        .allow(null)
        .messages({
            'array.base': 'Bill photos must be an array',
            'array.max': 'A maximum of 5 bill photos are allowed',
        }),
    invoiceDate: Joi.date().optional().messages({
        'date.base': 'Invoice date must be a valid date',
    }),
    isVatable: Joi.boolean().optional().default(false).messages({
        'boolean.base': 'isVatable must be a boolean value',
    }),
});

module.exports = { createExpenseSchema, updateExpenseSchema };
