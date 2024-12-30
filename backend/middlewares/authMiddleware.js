const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Role-based access control middleware
const roleBasedAccess = (allowedRoleDescriptions) => {
    return (req, res, next) => {
        // Ensure the user is an admin and their roleDescription is allowed
        if (!(req.user.role === 'admin' && allowedRoleDescriptions.includes(req.user.roleDescription))) {
            return res.status(403).json({ message: 'Forbidden: Access is denied' });
        }
        next();
    };
};

module.exports = { protect, roleBasedAccess };
