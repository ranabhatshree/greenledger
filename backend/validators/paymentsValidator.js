const Joi = require('joi');

// Create Payment Validation Schema
const createPaymentSchema = Joi.object({
    type: Joi.string()
        .valid('cheque', 'fonepay', 'cash', 'bank_transfer') // Match schema enum
        .required()
        .messages({
            'any.required': 'Payment type is required',
            'any.only': 'Type must be one of [cheque, fonepay, cash, bank_transfer]',
        }),
    amount: Joi.number().positive().required().messages({
        'any.required': 'Amount is required',
        'number.positive': 'Amount must be a positive number',
        'number.base': 'Amount must be a valid number',
    }),
    billPhotos: Joi.array()
        .items(Joi.string().uri().messages({
            'string.base': 'Each bill photo must be a string',
            'string.uri': 'Each bill photo must be a valid URL',
        }))
        .max(5)
        .default([])
        .messages({
            'array.base': 'Bill photos must be an array of URLs',
            'array.max': 'Bill photos can contain at most 5 URLs',
        }),
    paidBy: Joi.string().required().messages({
        'any.required': 'Paid by (User ID) is required',
        'string.base': 'Paid by must be a string',
    }),
    description: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Description must be a string',
    }),
    invoiceNumber: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Invoice number must be a string',
    }),
    invoiceDate: Joi.date().required().messages({
        'date.base': 'Payment received date must be a valid date',
        'any.required': 'Payment received date is required',
    }),    
    paymentDepositedDate: Joi.date().optional().allow(null).messages({
        'date.base': 'Payment deposited date must be a valid date',
    }),
    receivedOrPaid: Joi.boolean().optional().messages({
        'boolean.base': 'Received or Paid must be a boolean value',
    }),
});

// Update Payment Validation Schema
const updatePaymentSchema = Joi.object({
    type: Joi.string()
        .valid('cheque', 'fonepay', 'cash', 'bank_transfer') // Match schema enum
        .optional()
        .messages({
            'any.only': 'Type must be one of [cheque, fonepay, cash, bank_transfer]',
        }),
    amount: Joi.number().positive().optional().messages({
        'number.positive': 'Amount must be a positive number',
        'number.base': 'Amount must be a valid number',
    }),
    billPhotos: Joi.array()
        .items(Joi.string().uri().messages({
            'string.base': 'Each bill photo must be a string',
            'string.uri': 'Each bill photo must be a valid URL',
        }))
        .max(5)
        .optional()
        .default([])
        .messages({
            'array.base': 'Bill photos must be an array of URLs',
            'array.max': 'Bill photos can contain at most 5 URLs',
        }),
    paidBy: Joi.string().optional().messages({
        'string.base': 'Paid by must be a string',
    }),
    description: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Description must be a string',
    }),
    invoiceNumber: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Invoice number must be a string',
    }),
    invoiceDate: Joi.date().required().messages({
        'date.base': 'Payment received date must be a valid date',
        'any.required': 'Payment received date is required',
    }),    
    paymentDepositedDate: Joi.date().optional().allow(null).messages({
        'date.base': 'Payment deposited date must be a valid date',
    }),
    receivedOrPaid: Joi.boolean().optional().messages({
        'boolean.base': 'Received or Paid must be a boolean value',
    }),
});

module.exports = { createPaymentSchema, updatePaymentSchema };
