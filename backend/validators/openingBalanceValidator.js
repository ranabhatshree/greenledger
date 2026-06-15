const Joi = require('joi');

const createOpeningBalanceSchema = Joi.object({
    partyId: Joi.string().required().messages({
        'any.required': 'Party ID is required',
        'string.base': 'Party ID must be a string',
    }),
    fiscalYearId: Joi.string().required().messages({
        'any.required': 'Fiscal year ID is required',
        'string.base': 'Fiscal year ID must be a string',
    }),
    amount: Joi.number().required().messages({
        'any.required': 'Amount is required',
        'number.base': 'Amount must be a number',
    }),
    type: Joi.string().valid('CR', 'DR').required().messages({
        'any.required': 'Type is required',
        'any.only': 'Type must be either CR or DR',
    }),
});

const updateOpeningBalanceSchema = Joi.object({
    amount: Joi.number().optional().messages({
        'number.base': 'Amount must be a number',
    }),
    type: Joi.string().valid('CR', 'DR').optional().messages({
        'any.only': 'Type must be either CR or DR',
    }),
});

module.exports = { createOpeningBalanceSchema, updateOpeningBalanceSchema };
