const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const permissionsData = require('./permissions');

dotenv.config({ path: '../.env' }); // Adjust path if running from seeds dir

const seedPermissions = async () => {
    try {
        // Connect to DB
        // Assuming MONGO_URI is in .env. If running this script directly, we need to ensure .env is loaded.
        // The user might run this via `node seeds/seedPermissions.js` from backend root.
        // So path to .env is just .env
        if (!process.env.MONGO_URI) {
            dotenv.config(); // Try loading from current dir
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Seed Permissions
        for (const perm of permissionsData) {
            await Permission.findOneAndUpdate(
                { name: perm.name },
                perm,
                { upsert: true, new: true }
            );
        }
        console.log('Permissions seeded');

        // Seed System Roles
        const allPermissions = permissionsData.map(p => p.name);

        const adminRole = {
            name: 'Admin',
            description: 'System Administrator with full access',
            permissions: allPermissions,
            isSystemRole: true
        };

        const accountantRole = {
            name: 'Accountant',
            description: 'Access to finance, journal, and reports',
            permissions: ['view_accounts', 'edit_accounts', 'create_journal', 'view_journal', 'view_reports'],
            isSystemRole: true
        };

        const viewerRole = {
            name: 'Viewer',
            description: 'Read-only access',
            permissions: ['view_users', 'view_accounts', 'view_journal', 'view_reports'],
            isSystemRole: true
        };

        const roles = [adminRole, accountantRole, viewerRole];

        for (const role of roles) {
            await Role.findOneAndUpdate(
                { name: role.name, isSystemRole: true },
                role,
                { upsert: true, new: true }
            );
        }
        console.log('System roles seeded');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    seedPermissions();
}

module.exports = seedPermissions;
