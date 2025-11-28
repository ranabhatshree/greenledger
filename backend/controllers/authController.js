const User = require("../models/User");
const Role = require("../models/Role");
const Permission = require("../models/Permission");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const { sendEmail } = require("../utils/emailService"); // Import the email service
const crypto = require("crypto"); // For generating secure tokens
const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

const BASE_URL = process.env.BASE_URL; // Base URL from environment variables

const registerUser = async (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string()
        .pattern(/^(98|97)[0-9]{8}$/)
        .required()
        .messages({
          "string.pattern.base":
            "Phone number must start with 98 or 97 and be exactly 10 digits.",
        }),
      password: Joi.string().min(8).required().messages({
        "string.min": "Password length must be at least 8 characters long.",
      }),
      role: Joi.string().optional(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ message: error.details[0].message.replace(/['"]+/g, "") });
    }

    const { name, email, phone, password } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res
        .status(400)
        .json({ message: "User with this phone number already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Find or create Admin system role
    let adminRole = await Role.findOne({ name: 'Admin', isSystemRole: true });
    
    if (!adminRole) {
      // If Admin role doesn't exist, create it with all permissions
      const allPermissions = await Permission.find({});
      const permissionNames = allPermissions.map(p => p.name);
      
      adminRole = await Role.create({
        name: 'Admin',
        description: 'System Administrator with full access',
        permissions: permissionNames.length > 0 ? permissionNames : [
          'manage_users',
          'view_users',
          'manage_roles',
          'view_accounts',
          'edit_accounts',
          'create_journal',
          'view_journal',
          'view_reports',
          'view_dashboard_stats',
          'view_sales_stats',
          'view_vendor_stats',
          'manage_company_settings'
        ],
        isSystemRole: true,
        companyId: null
      });
    }

    // Automatically assign admin role to all new registrations
    const role = 'admin';
    const permissionsOverride = adminRole.permissions || [];

    const user = new User({ 
      name, 
      email, 
      phone, 
      password: hashedPassword, 
      role,
      roleId: adminRole._id,
      permissionsOverride
    });
    await user.save();

    // Create Onboarding Session
    const OnboardingSession = require("../models/OnboardingSession");
    await OnboardingSession.create({ userId: user._id });

    const token = jwt.sign(
      { id: user._id }, // Removed role from payload
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      message: "User registered successfully.",
      token: token,
    });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user._id }, // Removed role from payload
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

const addPartyByAdmin = async (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string()
        .pattern(/^(98|97)[0-9]{8}$/)
        .required()
        .messages({
          "string.pattern.base":
            "Phone number must start with 98 or 97 and be exactly 10 digits.",
        }),
      panNumber: Joi.string().required().messages({
        "any.required": "PAN number is required.",
      }),
      address: Joi.string().required().messages({
        "any.required": "Address is required.",
      }),
      role: Joi.string()
        .valid("user", "vendor", "supplier")
        .required()
        .messages({
          "any.only": "Invalid Role!",
        }),
      partyMargin: Joi.number().min(0).default(0).optional().messages({
        "number.base": "Party margin must be a number",
        "number.min": "Party margin cannot be negative",
      }),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .json({ message: error.details[0].message.replace(/['"]+/g, "") });
    }

    const { name, email, phone, panNumber, address, role, partyMargin } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res
        .status(400)
        .json({ message: "User with this phone number already exists." });
    }

    const user = new User({
      name,
      email,
      phone,
      panNumber,
      address,
      role,
      partyMargin
    });

    await user.save();

    res.status(201).json({
      message: "Party added successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        panNumber: user.panNumber,
        address: user.address,
        partyMargin: user.partyMargin
      },
    });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

const getUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.query;

    if (!role) {
      return res.status(400).json({ message: "Role parameter is required." });
    }

    // Split roles by comma and trim spaces
    const roles = role.split(",").map((r) => r.trim());

    const users = await User.find({ role: { $in: roles } }).select(
      "id name email phone panNumber address role partyMargin"
    );

    if (users.length === 0) {
      return res
        .status(404)
        .json({ message: `No users found with roles: [${roles.join(", ")}].` });
    }

    res.status(200).json({
      message: `Users with roles: [${roles.join(", ")}] fetched successfully.`,
      users,
    });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

const logoutUser = async (req, res, next) => {
  try {
    // Get token from the authorization header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify the token is valid
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // For additional security, you could implement a token blacklist here
    // This would require a database or cache to store invalidated tokens
    // await TokenBlacklist.create({ token });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token and expiration
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiration

    // Update user with reset token
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Generate reset link using base URL from .env
    if (!BASE_URL) {
      return res.status(500).json({ message: "Server configuration error: BASE_URL is not set" });
    }
    const resetLink = `${BASE_URL}/reset-password?token=${resetToken}`;

    // Email content
    const emailContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password - Adora Baby</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333; background-color: #f4f4f4;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">
                <tr>
                    <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
                        <img src="https://adora.baby/wp-content/uploads/2022/05/cropped-cropped-adora-logo.png" alt="Adora Baby" style="max-width: 120px; height: auto;">
                    </td>
                </tr>
                <tr>
                    <td style="background-color: #ffffff; padding: 40px 30px;">
                        <h1 style="margin: 0 0 20px 0; font-size: 24px; line-height: 1.2; color: #9c64cc; font-weight: 600;">Reset Your Password</h1>
                        <p style="margin: 0 0 20px 0;">Hello, ${user.name}</p>
                        <p style="margin: 0 0 20px 0;">We received a request to reset your password for your Adora Baby account. If you didn't make this request, you can safely ignore this email.</p>
                        <p style="margin: 0 0 20px 0;">To reset your password, click the button below:</p>
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px auto;">
                            <tr>
                                <td style="border-radius: 8px; background-color: #9c64cc;">
                                    <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 15px 30px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: 500;">Reset Password</a>
                                </td>
                            </tr>
                        </table>
                        <p style="margin: 0 0 20px 0;">If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style="margin: 0 0 20px 0; word-break: break-all;"><a href="${resetLink}" style="color: #9c64cc; text-decoration: underline;">${resetLink}</a></p>
                        <p style="margin: 0 0 20px 0;">This password reset link will expire in 1 hour.</p>
                        <p style="margin: 0;">Best regards,<br>The Adora Baby Team</p>
                    </td>
                </tr>
                <tr>
                    <td style="background-color: #f8f4fc; padding: 20px 30px; text-align: center; color: #666666; font-size: 14px;">
                        <p style="margin: 0 0 10px 0;">&copy; ${new Date().getFullYear()} Adora Baby. All rights reserved.</p>
                        <p style="margin: 0;">
                            <a href="https://adora.baby/privacy" style="color: #9c64cc; text-decoration: underline;">Privacy Policy</a> | 
                            <a href="https://adora.baby/terms" style="color: #9c64cc; text-decoration: underline;">Terms of Service</a>
                        </p>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

    // Send email
    await sendEmail(email, "Reset Your Password", emailContent);

    res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

const confirmResetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Validate inputs
    const schema = Joi.object({
      token: Joi.string().required().messages({
        'any.required': 'Token is required',
        'string.base': 'Token must be a string',
      }),
      password: Joi.string().min(8).required().messages({
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'Password is required',
      }),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message.replace(/['"]+/g, "")
      });
    }

    // Find user with the reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() } // Check if token has not expired
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired password reset token"
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      message: "Password reset successfully. You can now login with your new password."
    });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

const getSingleUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        status: "error",
        message: "User ID parameter is required.",
      });
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid user ID format.",
      });
    }

    const user = await User.findById(userId)
      .select("id name email phone panNumber address role")
      .lean();

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "User fetched successfully.",
      user: user,
    });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

const uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;
    const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;

    await User.findByIdAndUpdate(userId, { profilePicture: profilePictureUrl });

    // Update Onboarding Session if needed
    const OnboardingSession = require("../models/OnboardingSession");
    await OnboardingSession.findOneAndUpdate(
      { userId: userId },
      { step: 'completed' }, // Assuming this is the last step
      { upsert: true }
    );

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePictureUrl
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  addPartyByAdmin,
  getUsersByRole,
  logoutUser,
  resetPassword,
  confirmResetPassword,
  getSingleUser,
  uploadProfilePicture
};
