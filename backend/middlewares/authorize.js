const { protect } = require('./authMiddleware');
const User = require('../models/User');
const Role = require('../models/Role');

const authorize = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const user = req.user; // Populated by protect middleware

            if (!user) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            // 1. Check permissionsOverride
            if (user.permissionsOverride && user.permissionsOverride.includes(requiredPermission)) {
                return next();
            }

            // 2. Check Role permissions
            if (user.roleId) {
                const role = await Role.findById(user.roleId);
                if (role && role.permissions.includes(requiredPermission)) {
                    return next();
                }
            }

            // 3. Backward compatibility or Super Admin check (optional)
            // If user is old admin, maybe allow all?
            if (user.role === 'admin' && user.roleDescription === 'superadmin') {
                return next();
            }

            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        } catch (error) {
            next(error);
        }
    };
};

module.exports = authorize;
