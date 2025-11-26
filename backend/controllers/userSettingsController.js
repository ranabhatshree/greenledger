const UserSettings = require('../models/UserSettings');

const getSettings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        let settings = await UserSettings.findOne({ userId });

        if (!settings) {
            // Create default settings if not found
            settings = new UserSettings({ userId });
            await settings.save();
        }

        res.status(200).json({ settings });
    } catch (error) {
        next(error);
    }
};

const updateSettings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const settings = await UserSettings.findOneAndUpdate(
            { userId },
            req.body,
            { new: true, upsert: true }
        );
        res.status(200).json({ message: 'Settings updated', settings });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSettings,
    updateSettings
};
