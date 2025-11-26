const Company = require('../models/Company');
const User = require('../models/User');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');

// Get company settings (admin only)
const getCompanySettings = async (req, res, next) => {
    try {
        const company = await Company.findById(req.user.companyId).populate('ownerId', 'name email');
        
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check if user is admin or owner
        const isAdmin = req.user.role === 'admin' || 
                      (req.user.roleData && req.user.roleData.name === 'Admin');
        const ownerId = company.ownerId._id ? company.ownerId._id.toString() : company.ownerId.toString();
        const isOwner = ownerId === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Access denied. Admin or owner access required.' });
        }

        res.status(200).json({ company });
    } catch (error) {
        next(error);
    }
};

// Update company settings (admin only)
const updateCompanySettings = async (req, res, next) => {
    try {
        const schema = Joi.object({
            companyName: Joi.string().optional(),
            companyType: Joi.string().allow(null, '').optional(),
            registrationNumber: Joi.string().allow(null, '').optional(),
            address: Joi.string().optional(),
            currency: Joi.string().optional(),
            timezone: Joi.string().optional(),
            fiscalYearStartMonth: Joi.string().optional(),
            logoUrl: Joi.string().allow(null, '').optional(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const company = await Company.findById(req.user.companyId);
        
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check if user is admin or owner
        const isAdmin = req.user.role === 'admin' || 
                      (req.user.roleData && req.user.roleData.name === 'Admin');
        const isOwner = company.ownerId.toString() === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Access denied. Admin or owner access required.' });
        }

        // Update company fields
        Object.keys(value).forEach(key => {
            if (value[key] !== undefined) {
                company[key] = value[key];
            }
        });
        
        company.updatedAt = Date.now();
        await company.save();

        res.status(200).json({
            message: 'Company settings updated successfully',
            company
        });
    } catch (error) {
        next(error);
    }
};

// Upload company logo
const uploadCompanyLogo = async (req, res, next) => {
    try {
        console.log('Upload company logo request:', {
            hasFile: !!req.file,
            file: req.file ? {
                fieldname: req.file.fieldname,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            } : null,
            companyId: req.user?.companyId,
            userId: req.user?._id
        });

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded. Please select an image file.' });
        }

        const company = await Company.findById(req.user.companyId);
        
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Check if user is admin or owner
        const isAdmin = req.user.role === 'admin' || 
                      (req.user.roleData && req.user.roleData.name === 'Admin');
        const ownerId = company.ownerId._id ? company.ownerId._id.toString() : company.ownerId.toString();
        const isOwner = ownerId === req.user._id.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Access denied. Admin or owner access required.' });
        }

        const logoUrl = `/uploads/company-logos/${req.file.filename}`;

        // Delete old logo if exists
        if (company.logoUrl && company.logoUrl.startsWith('/uploads/company-logos/')) {
            const oldFilePath = path.join(process.cwd(), company.logoUrl);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        company.logoUrl = logoUrl;
        company.updatedAt = Date.now();
        await company.save();

        res.status(200).json({
            message: 'Company logo uploaded successfully',
            logoUrl: logoUrl
        });
    } catch (error) {
        console.error('Error uploading company logo:', error);
        next(error);
    }
};

module.exports = {
    getCompanySettings,
    updateCompanySettings,
    uploadCompanyLogo
};

