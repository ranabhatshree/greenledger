const Joi = require('joi');
const mongoose = require('mongoose');
const Party = require('../models/Party');

// Custom validator to check if partyId exists and belongs to the same company
const isValidPartyId = async (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid party ID format.');
    }

    const party = await Party.findById(value);
    if (!party) {
        return helpers.message('Party with the given ID does not exist.');
    }

    return value;
};

// Create Party Validation Schema
const createPartySchema = Joi.object({
    name: Joi.string().required().messages({
        'any.required': 'Name is required',
        'string.base': 'Name must be a string',
    }),
    phone: Joi.string().required().messages({
        'any.required': 'Phone is required',
        'string.base': 'Phone must be a string',
    }),
    altPhone: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Alternate phone must be a string',
    }),
    contactPerson: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Contact person must be a string',
    }),
    email: Joi.string().email().optional().allow(null, '').messages({
        'string.email': 'Email must be a valid email address',
    }),
    address: Joi.string().required().messages({
        'any.required': 'Address is required',
        'string.base': 'Address must be a string',
    }),
    panNumber: Joi.string().required().messages({
        'any.required': 'PAN number is required',
        'string.base': 'PAN number must be a string',
    }),
    isVatable: Joi.boolean().default(true).messages({
        'boolean.base': 'Is Vatable must be a boolean',
    }),
    partyMargin: Joi.number().default(0).messages({
        'number.base': 'Party margin must be a number',
    }),
    closingBalance: Joi.number().default(0).messages({
        'number.base': 'Closing balance must be a number',
    }),
    website: Joi.string().uri().optional().allow(null, '').messages({
        'string.uri': 'Website must be a valid URL',
    }),
    role: Joi.string().valid('vendor', 'supplier').required().messages({
        'any.required': 'Role is required',
        'any.only': 'Role must be either "vendor" or "supplier"',
    }),
});

// Update Party Validation Schema
const updatePartySchema = Joi.object({
    name: Joi.string().optional().messages({
        'string.base': 'Name must be a string',
    }),
    phone: Joi.string().optional().messages({
        'string.base': 'Phone must be a string',
    }),
    altPhone: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Alternate phone must be a string',
    }),
    contactPerson: Joi.string().optional().allow(null, '').messages({
        'string.base': 'Contact person must be a string',
    }),
    email: Joi.string().email().optional().allow(null, '').messages({
        'string.email': 'Email must be a valid email address',
    }),
    address: Joi.string().optional().messages({
        'string.base': 'Address must be a string',
    }),
    panNumber: Joi.string().optional().messages({
        'string.base': 'PAN number must be a string',
    }),
    isVatable: Joi.boolean().optional().messages({
        'boolean.base': 'Is Vatable must be a boolean',
    }),
    partyMargin: Joi.number().optional().messages({
        'number.base': 'Party margin must be a number',
    }),
    closingBalance: Joi.number().optional().messages({
        'number.base': 'Closing balance must be a number',
    }),
    website: Joi.string().uri().optional().allow(null, '').messages({
        'string.uri': 'Website must be a valid URL',
    }),
    role: Joi.string().valid('vendor', 'supplier').optional().messages({
        'any.only': 'Role must be either "vendor" or "supplier"',
    }),
});

module.exports = { createPartySchema, updatePartySchema, isValidPartyId };

