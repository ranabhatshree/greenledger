const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const Company = require('../models/Company');

// Protect middleware to verify JWT
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        
        // Auto-fix: If user doesn't have companyId but owns a company, set it
        if (req.user && !req.user.companyId) {
            const ownedCompany = await Company.findOne({ ownerId: req.user._id });
            if (ownedCompany) {
                req.user.companyId = ownedCompany._id;
                await req.user.save();
                console.log(`Auto-fixed companyId for user ${req.user.name} (${req.user._id})`);
            }
        }
        
        // Populate roleId if it exists
        if (req.user && req.user.roleId) {
            req.user.roleData = await Role.findById(req.user.roleId);
        }
        
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Role-based access control middleware - Updated to work with roleId and permissions
const roleBasedAccess = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            // Check if user has admin role (either via roleId or legacy role field)
            const isAdmin = req.user.role === 'admin' || 
                          (req.user.roleData && req.user.roleData.name === 'Admin');

            // If user is admin, allow access
            if (isAdmin) {
                return next();
            }

            // Backward compatibility: Check roleDescription for legacy users
            if (req.user.roleDescription && allowedRoles.includes(req.user.roleDescription)) {
                return next();
            }

            // Check if user has required permissions via roleId
            if (req.user.roleId && req.user.roleData) {
                const rolePermissions = req.user.roleData.permissions || [];
                const userPermissions = req.user.permissionsOverride || [];
                const allPermissions = [...rolePermissions, ...userPermissions];

                // Check if user has any of the required permissions for stats
                const statsPermissions = ['view_dashboard_stats', 'view_sales_stats', 'view_vendor_stats', 'view_reports'];
                const hasStatsPermission = statsPermissions.some(perm => allPermissions.includes(perm));

                if (hasStatsPermission) {
                    return next();
                }
            }

            return res.status(403).json({ message: 'Forbidden: Access is denied' });
        } catch (error) {
            return res.status(500).json({ message: 'Error checking permissions' });
        }
    };
};

module.exports = { protect, roleBasedAccess };
