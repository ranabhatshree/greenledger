const Permission = require('../models/Permission');

const getAllPermissions = async (req, res, next) => {
    try {
        const permissions = await Permission.find({});
        res.status(200).json({ permissions });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllPermissions
};
