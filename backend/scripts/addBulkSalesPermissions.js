const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Role = require('../models/Role');

/**
 * Script to add bulk-sales permissions to users or roles
 * 
 * Usage:
 * - Add to specific user: node scripts/addBulkSalesPermissions.js --user <userId>
 * - Add to specific role: node scripts/addBulkSalesPermissions.js --role <roleId>
 * - Add to all admin users: node scripts/addBulkSalesPermissions.js --admin
 * - Add to Admin role: node scripts/addBulkSalesPermissions.js --admin-role
 */

const BULK_SALES_PERMISSIONS = [
    'view_bulk_sales',
    'create_bulk_sales',
    'update_bulk_sales',
    'delete_bulk_sales',
    'upload_bulk_sales'
];

const addPermissionsToUser = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            console.error(`❌ User with ID ${userId} not found`);
            return;
        }

        const currentPermissions = user.permissionsOverride || [];
        const newPermissions = [...new Set([...currentPermissions, ...BULK_SALES_PERMISSIONS])];
        
        user.permissionsOverride = newPermissions;
        user.updatedAt = new Date();
        await user.save();

        console.log(`✅ Added bulk-sales permissions to user: ${user.name} (${user.email})`);
        console.log(`   Permissions: ${newPermissions.join(', ')}`);
    } catch (error) {
        console.error(`❌ Error updating user ${userId}:`, error.message);
    }
};

const addPermissionsToRole = async (roleId) => {
    try {
        const role = await Role.findById(roleId);
        if (!role) {
            console.error(`❌ Role with ID ${roleId} not found`);
            return;
        }

        const currentPermissions = role.permissions || [];
        const newPermissions = [...new Set([...currentPermissions, ...BULK_SALES_PERMISSIONS])];
        
        role.permissions = newPermissions;
        role.updatedAt = new Date();
        await role.save();

        console.log(`✅ Added bulk-sales permissions to role: ${role.name}`);
        console.log(`   Permissions: ${newPermissions.join(', ')}`);
    } catch (error) {
        console.error(`❌ Error updating role ${roleId}:`, error.message);
    }
};

const addPermissionsToAllAdmins = async () => {
    try {
        const adminUsers = await User.find({ role: 'admin' });
        console.log(`📋 Found ${adminUsers.length} admin users`);

        for (const user of adminUsers) {
            const currentPermissions = user.permissionsOverride || [];
            const newPermissions = [...new Set([...currentPermissions, ...BULK_SALES_PERMISSIONS])];
            
            user.permissionsOverride = newPermissions;
            user.updatedAt = new Date();
            await user.save();

            console.log(`✅ Updated user: ${user.name} (${user.email})`);
        }

        console.log(`\n✅ Successfully updated ${adminUsers.length} admin users`);
    } catch (error) {
        console.error(`❌ Error updating admin users:`, error.message);
    }
};

const addPermissionsToAdminRole = async () => {
    try {
        const adminRole = await Role.findOne({ name: 'Admin', isSystemRole: true });
        if (!adminRole) {
            console.error(`❌ Admin role not found`);
            return;
        }

        const currentPermissions = adminRole.permissions || [];
        const newPermissions = [...new Set([...currentPermissions, ...BULK_SALES_PERMISSIONS])];
        
        adminRole.permissions = newPermissions;
        adminRole.updatedAt = new Date();
        await adminRole.save();

        console.log(`✅ Added bulk-sales permissions to Admin role`);
        console.log(`   Total permissions: ${newPermissions.length}`);
    } catch (error) {
        console.error(`❌ Error updating Admin role:`, error.message);
    }
};

const main = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const args = process.argv.slice(2);
        
        if (args.includes('--user')) {
            const userIdIndex = args.indexOf('--user') + 1;
            const userId = args[userIdIndex];
            if (!userId) {
                console.error('❌ Please provide a user ID: --user <userId>');
                process.exit(1);
            }
            await addPermissionsToUser(userId);
        } else if (args.includes('--role')) {
            const roleIdIndex = args.indexOf('--role') + 1;
            const roleId = args[roleIdIndex];
            if (!roleId) {
                console.error('❌ Please provide a role ID: --role <roleId>');
                process.exit(1);
            }
            await addPermissionsToRole(roleId);
        } else if (args.includes('--admin')) {
            await addPermissionsToAllAdmins();
        } else if (args.includes('--admin-role')) {
            await addPermissionsToAdminRole();
        } else {
            console.log('Usage:');
            console.log('  Add to specific user: node scripts/addBulkSalesPermissions.js --user <userId>');
            console.log('  Add to specific role: node scripts/addBulkSalesPermissions.js --role <roleId>');
            console.log('  Add to all admin users: node scripts/addBulkSalesPermissions.js --admin');
            console.log('  Add to Admin role: node scripts/addBulkSalesPermissions.js --admin-role');
            console.log('\nExample:');
            console.log('  node scripts/addBulkSalesPermissions.js --user 692995d05dd0e4bca4e170a4');
            console.log('  node scripts/addBulkSalesPermissions.js --role 69230c0482d916ebf8ddc87c');
        }

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

main();

