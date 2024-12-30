const express = require('express');
const { uploadFile } = require('../controllers/helperController');
const { protect, roleBasedAccess } = require('../middlewares/authMiddleware');
const createFileUploadMiddleware = require('../middlewares/generalFileUploadMiddleware');
const { sendEmail } = require('../utils/emailService'); // Import the email service

const router = express.Router();

// Configure the middleware for images
const imageUploadMiddleware = createFileUploadMiddleware(
    ['image/jpeg', 'image/png'], // Allow only JPEG and PNG images
    5 * 1024 * 1024 // Max file size 5MB
);

// Route for image upload
router.post(
    '/upload-image',
    protect,
    roleBasedAccess(['admin', 'superadmin']), // Restrict access
    imageUploadMiddleware.single('file'), // Single image upload
    uploadFile
);

// Test Route for Sending Email
router.post('/send-test-email', async (req, res) => {
    try {
        const { email } = req.body; // Get the email address from the request body

        // Test email content
        const subject = "Forgot Passowrd ? - Adora Baby";
        const content = `
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
                <p style="margin: 0 0 20px 0;">Hello,</p>
                <p style="margin: 0 0 20px 0;">We received a request to reset your password for your Adora Baby account. If you didn't make this request, you can safely ignore this email.</p>
                <p style="margin: 0 0 20px 0;">To reset your password, click the button below:</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px auto;">
                    <tr>
                        <td style="border-radius: 8px; background-color: #9c64cc;">
                            <a href="https://adora.baby/reset-password?token=UNIQUE_TOKEN_HERE" target="_blank" style="display: inline-block; padding: 15px 30px; font-size: 16px; color: #ffffff; text-decoration: none; font-weight: 500;">Reset Password</a>
                        </td>
                    </tr>
                </table>
                <p style="margin: 0 0 20px 0;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="margin: 0 0 20px 0; word-break: break-all;"><a href="https://adora.baby/reset-password?token=UNIQUE_TOKEN_HERE" style="color: #9c64cc; text-decoration: underline;">https://adora.baby/reset-password?token=UNIQUE_TOKEN_HERE</a></p>
                <p style="margin: 0 0 20px 0;">This password reset link will expire in 24 hours for security reasons.</p>
                <p style="margin: 0 0 20px 0;">If you didn't request a password reset, please contact our support team immediately.</p>
                <p style="margin: 0;">Best regards,<br>The Adora Baby Team</p>
            </td>
        </tr>
        <tr>
            <td style="background-color: #f8f4fc; padding: 20px 30px; text-align: center; color: #666666; font-size: 14px;">
                <p style="margin: 0 0 10px 0;">&copy; 2023 Adora Baby. All rights reserved.</p>
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

        // Send email using Brevo
        await sendEmail(email, subject, content);

        res.status(200).json({ message: "Test email sent successfully!" });
    } catch (error) {
        console.error('Error sending email:', error.message);
        res.status(500).json({ message: "Failed to send email", error: error.message });
    }
});


module.exports = router;
