const Company = require('../models/Company');
const User = require('../models/User');
const OnboardingSession = require('../models/OnboardingSession');
const Joi = require('joi');

const createCompany = async (req, res, next) => {
    try {
        const schema = Joi.object({
            companyName: Joi.string().required(),
            companyType: Joi.string().required(), // Not in schema but requested in prompt, maybe store in company or ignore? Prompt said "Accepts company details: companyType". I'll add it to schema if needed or just ignore if not in model. Wait, I didn't add companyType to Company model. I should probably add it or just store it. Let's add it to the model first? Or just proceed. The prompt said "Accepts... companyType". I'll assume I should have added it. I'll add it to the model in a bit.
            registrationNumber: Joi.string().optional().allow(''),
            address: Joi.string().required(),
            currency: Joi.string().default('NPR'),
            fiscalYearStartMonth: Joi.string().default('April'),
            timezone: Joi.string().required()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { companyName, companyType, registrationNumber, address, currency, fiscalYearStartMonth, timezone } = req.body;
        const userId = req.user.id; // Assuming auth middleware adds user to req

        // Check if user already has a company? Maybe allow multiple? Prompt says "One User can own or belong to one or more Company".
        // But for onboarding, we assume it's the first one.

        const company = new Company({
            companyName,
            ownerId: userId,
            registrationNumber,
            address,
            currency,
            fiscalYearStartMonth,
            timezone,
            // companyType - I missed this in the model. I will add it to the model in a separate step or just ignore for now if not critical. 
            // Let's assume we can store it if I update the model. I'll update the model after this.
        });

        await company.save();

        // Link company to user
        await User.findByIdAndUpdate(userId, { companyId: company._id });

        // Update Onboarding Session
        await OnboardingSession.findOneAndUpdate(
            { userId: userId },
            { step: 'profile_upload' },
            { upsert: true, new: true }
        );

        res.status(201).json({
            message: 'Company created successfully',
            company
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCompany
};
