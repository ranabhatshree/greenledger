const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const companyName = process.env.COMPANY_NAME
const companyEmail = process.env.COMPANY_EMAIL

// Configure API key
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const sendEmail = async (toEmail, subject, content) => {
    try {
        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

        const emailData = {
            sender: { name: companyName, email: companyEmail },
            to: [{ email: toEmail }],
            subject: subject,
            htmlContent: content,
        };

        const response = await apiInstance.sendTransacEmail(emailData);
        return response;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
};

module.exports = { sendEmail };
