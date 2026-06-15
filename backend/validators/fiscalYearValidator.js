const Joi = require('joi');

const createFiscalYearSchema = Joi.object({
    title: Joi.string().required().messages({
        'any.required': 'Title is required',
        'string.base': 'Title must be a string',
    }),
    shortDescription: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Short description must be a string',
    }),
    fromDate: Joi.date().required().messages({
        'any.required': 'From date is required',
        'date.base': 'From date must be a valid date',
    }),
    toDate: Joi.date().required().messages({
        'any.required': 'To date is required',
        'date.base': 'To date must be a valid date',
    }),
    isActive: Joi.boolean().default(false).messages({
        'boolean.base': 'isActive must be a boolean',
    }),
});

const updateFiscalYearSchema = Joi.object({
    title: Joi.string().optional().messages({
        'string.base': 'Title must be a string',
    }),
    shortDescription: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Short description must be a string',
    }),
    fromDate: Joi.date().optional().messages({
        'date.base': 'From date must be a valid date',
    }),
    toDate: Joi.date().optional().messages({
        'date.base': 'To date must be a valid date',
    }),
    isActive: Joi.boolean().optional().messages({
        'boolean.base': 'isActive must be a boolean',
    }),
});

module.exports = { createFiscalYearSchema, updateFiscalYearSchema };
