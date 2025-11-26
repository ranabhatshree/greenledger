const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');

// Get current user profile
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password -resetPasswordToken -resetPasswordExpires')
            .populate('roleId', 'name permissions')
            .populate('companyId', 'companyName');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
};

// Upload profile picture
const uploadProfilePicture = async (req, res, next) => {
    try {
        console.log('Upload profile picture request:', {
            hasFile: !!req.file,
            file: req.file ? {
                fieldname: req.file.fieldname,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            } : null,
            userId: req.user?._id
        });

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded. Please select an image file.' });
        }

        const userId = req.user._id;
        const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;

        // Get current user to delete old profile picture if exists
        const user = await User.findById(userId);
        if (user && user.profilePicture && user.profilePicture.startsWith('/uploads/profile-pictures/')) {
            const oldFilePath = path.join(process.cwd(), user.profilePicture);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        await User.findByIdAndUpdate(userId, { profilePicture: profilePictureUrl });

        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            profilePicture: profilePictureUrl
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        next(error);
    }
};

// Update current user profile
const updateProfile = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().optional(),
            email: Joi.string().email().optional(),
            phone: Joi.string().optional(),
            address: Joi.string().allow(null, '').optional(),
            panNumber: Joi.string().allow(null, '').optional(),
            profilePicture: Joi.string().allow(null, '').optional(),
            password: Joi.string().min(6).optional(),
            currentPassword: Joi.string().when('password', {
                is: Joi.exist(),
                then: Joi.required(),
                otherwise: Joi.optional()
            })
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If password is being updated, verify current password
        if (value.password) {
            if (!value.currentPassword) {
                return res.status(400).json({ message: 'Current password is required to change password' });
            }

            const isPasswordValid = await bcrypt.compare(value.currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            value.password = await bcrypt.hash(value.password, salt);
        }

        // Remove currentPassword from value object before updating
        delete value.currentPassword;

        // Update user fields
        Object.keys(value).forEach(key => {
            if (value[key] !== undefined) {
                user[key] = value[key];
            }
        });

        user.updatedAt = Date.now();
        await user.save();

        // Return user without password
        const updatedUser = await User.findById(req.user._id)
            .select('-password -resetPasswordToken -resetPasswordExpires')
            .populate('roleId', 'name permissions')
            .populate('companyId', 'companyName');

        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadProfilePicture
};

