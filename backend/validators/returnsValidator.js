const Joi = require('joi');

// Create Return Validation Schema
const createReturnSchema = Joi.object({
    amount: Joi.number().positive().required().messages({
        'any.required': 'Amount is required',
        'number.positive': 'Amount must be a positive number',
        'number.base': 'Amount must be a valid number',
    }),
    invoiceNumber: Joi.string().required().messages({
        'any.required': 'Invoice number is required',
        'string.base': 'Invoice number must be a string',
    }),
    returnedBy: Joi.string().required().messages({
        'any.required': 'Returned by (User ID) is required',
        'string.base': 'Returned by must be a string',
    }),
    description: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Description must be a string',
    }),
});

// Update Return Validation Schema
const updateReturnSchema = Joi.object({
    amount: Joi.number().positive().optional().messages({
        'number.positive': 'Amount must be a positive number',
        'number.base': 'Amount must be a valid number',
    }),
    invoiceNumber: Joi.string().optional().messages({
        'string.base': 'Invoice number must be a string',
    }),
    returnedBy: Joi.string().optional().messages({
        'string.base': 'Returned by must be a string',
    }),
    description: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Description must be a string',
    }),
});

module.exports = { createReturnSchema, updateReturnSchema };
