const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Party = require('../models/Party');
const Sales = require('../models/Sales');
const Returns = require('../models/Returns');
const Purchases = require('../models/Purchases');
const Payments = require('../models/Payments');
const Company = require('../models/Company');

/**
 * Migration script to migrate users with vendor/supplier roles to Parties
 * 
 * This script:
 * 1. Finds all users with role 'vendor' or 'supplier'
 * 2. Creates corresponding Party entries
 * 3. Maintains userId -> partyId mapping
 * 4. Updates Sales.billingParty, Returns.returnedBy, Purchases.suppliedBy, Payments.paidBy
 * 5. Preserves all user data (no deletion)
 */
const migrateParties = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get default companyId (first company in database)
        const companies = await Company.find({});
        if (companies.length === 0) {
            console.error('❌ No companies found in database. Please create a company first.');
            process.exit(1);
        }
        const defaultCompanyId = companies[0]._id;
        console.log(`ℹ️  Using default company: ${companies[0].companyName} (${defaultCompanyId})\n`);

        // Mapping: userId -> partyId
        const userToPartyMap = new Map();
        let partiesCreated = 0;
        let salesUpdated = 0;
        let returnsUpdated = 0;
        let purchasesUpdated = 0;
        let paymentsUpdated = 0;

        // Step 1: Find all users with vendor or supplier role
        console.log('📋 Step 1: Finding users with vendor/supplier roles...');
        const vendorSupplierUsers = await User.find({
            $or: [
                { role: 'vendor' },
                { role: 'supplier' }
            ]
        });

        if (vendorSupplierUsers.length === 0) {
            console.log('⚠️  No users with vendor/supplier roles found.');
            console.log('✅ Migration completed (nothing to migrate).');
            process.exit(0);
        }

        console.log(`Found ${vendorSupplierUsers.length} users to migrate.\n`);

        // Step 2: Create Party entries for each user
        console.log('📋 Step 2: Creating Party entries...');
        for (const user of vendorSupplierUsers) {
            try {
                // Determine party role from user role
                const partyRole = user.role === 'vendor' ? 'vendor' : 'supplier';

                // Check if party already exists (by PAN number if available)
                let party = null;
                if (user.panNumber) {
                    party = await Party.findOne({ panNumber: user.panNumber });
                }

                // If party doesn't exist, create it
                if (!party) {
                    // Generate a unique PAN if user doesn't have one
                    let panNumber = user.panNumber;
                    if (!panNumber) {
                        // Generate a temporary PAN based on user ID
                        panNumber = `TEMP-${user._id.toString().substring(0, 10)}`;
                        console.log(`⚠️  User ${user.name} (${user._id}) has no PAN number. Using temporary PAN: ${panNumber}`);
                    }

                    // Check if PAN already exists (handle duplicates)
                    let finalPanNumber = panNumber;
                    let counter = 1;
                    while (await Party.findOne({ panNumber: finalPanNumber })) {
                        finalPanNumber = `${panNumber}-${counter}`;
                        counter++;
                    }

                    // Determine companyId: use user's companyId, or find from related records, or use default
                    let companyId = user.companyId;
                    
                    if (!companyId) {
                        // Try to find companyId from related records
                        // Check Sales
                        const sale = await Sales.findOne({ 
                            $or: [
                                { billingParty: user._id },
                                { createdBy: user._id }
                            ]
                        }).limit(1);
                        if (sale && sale.companyId) {
                            companyId = sale.companyId;
                        }
                    }
                    
                    if (!companyId) {
                        // Check Returns
                        const returnEntry = await Returns.findOne({ 
                            $or: [
                                { returnedBy: user._id },
                                { createdBy: user._id }
                            ]
                        }).limit(1);
                        if (returnEntry && returnEntry.companyId) {
                            companyId = returnEntry.companyId;
                        }
                    }
                    
                    if (!companyId) {
                        // Check Purchases
                        const purchase = await Purchases.findOne({ 
                            $or: [
                                { suppliedBy: user._id },
                                { createdBy: user._id }
                            ]
                        }).limit(1);
                        if (purchase && purchase.companyId) {
                            companyId = purchase.companyId;
                        }
                    }
                    
                    if (!companyId) {
                        // Check Payments
                        const payment = await Payments.findOne({ 
                            $or: [
                                { paidBy: user._id },
                                { createdBy: user._id }
                            ]
                        }).limit(1);
                        if (payment && payment.companyId) {
                            companyId = payment.companyId;
                        }
                    }
                    
                    // Use default companyId if still not found
                    if (!companyId) {
                        companyId = defaultCompanyId;
                        console.log(`⚠️  User ${user.name} (${user._id}) has no companyId. Using default company.`);
                    }

                    party = new Party({
                        name: user.name,
                        phone: user.phone || 'N/A',
                        altPhone: null,
                        contactPerson: null,
                        email: user.email || null,
                        address: user.address || 'N/A',
                        panNumber: finalPanNumber,
                        isVatable: true,
                        partyMargin: user.partyMargin || 0,
                        closingBalance: 0,
                        website: null,
                        role: partyRole,
                        companyId: companyId,
                        createdBy: user._id, // Use user's own ID as creator
                    });

                    await party.save();
                    partiesCreated++;
                    console.log(`✅ Created party: ${party.name} (${party.role}) - PAN: ${party.panNumber}`);
                } else {
                    console.log(`ℹ️  Party already exists for ${user.name} (PAN: ${party.panNumber})`);
                }

                // Store mapping
                userToPartyMap.set(user._id.toString(), party._id.toString());
            } catch (error) {
                console.error(`❌ Error creating party for user ${user.name} (${user._id}):`, error.message);
                // Continue with next user
            }
        }

        console.log(`\n✅ Created ${partiesCreated} new parties.\n`);

        // Step 3: Update Sales.billingParty
        console.log('📋 Step 3: Updating Sales.billingParty...');
        const sales = await Sales.find({});
        for (const sale of sales) {
            try {
                let partyId = null;

                // Handle different billingParty formats
                if (mongoose.Types.ObjectId.isValid(sale.billingParty)) {
                    // It's an ObjectId - check if it's a user ID that needs migration
                    const userId = sale.billingParty.toString();
                    if (userToPartyMap.has(userId)) {
                        partyId = userToPartyMap.get(userId);
                    }
                } else if (typeof sale.billingParty === 'string') {
                    // It's a string - try to find if it matches a user ID
                    if (mongoose.Types.ObjectId.isValid(sale.billingParty)) {
                        const userId = sale.billingParty;
                        if (userToPartyMap.has(userId)) {
                            partyId = userToPartyMap.get(userId);
                        }
                    }
                }

                if (partyId) {
                    sale.billingParty = partyId;
                    await sale.save();
                    salesUpdated++;
                }
            } catch (error) {
                console.error(`❌ Error updating sale ${sale._id}:`, error.message);
            }
        }
        console.log(`✅ Updated ${salesUpdated} sales.\n`);

        // Step 4: Update Returns.returnedBy
        console.log('📋 Step 4: Updating Returns.returnedBy...');
        const returns = await Returns.find({});
        for (const returnEntry of returns) {
            try {
                const userId = returnEntry.returnedBy.toString();
                if (userToPartyMap.has(userId)) {
                    returnEntry.returnedBy = userToPartyMap.get(userId);
                    await returnEntry.save();
                    returnsUpdated++;
                }
            } catch (error) {
                console.error(`❌ Error updating return ${returnEntry._id}:`, error.message);
            }
        }
        console.log(`✅ Updated ${returnsUpdated} returns.\n`);

        // Step 5: Update Purchases.suppliedBy
        console.log('📋 Step 5: Updating Purchases.suppliedBy...');
        const purchases = await Purchases.find({});
        for (const purchase of purchases) {
            try {
                const userId = purchase.suppliedBy.toString();
                if (userToPartyMap.has(userId)) {
                    purchase.suppliedBy = userToPartyMap.get(userId);
                    await purchase.save();
                    purchasesUpdated++;
                }
            } catch (error) {
                console.error(`❌ Error updating purchase ${purchase._id}:`, error.message);
            }
        }
        console.log(`✅ Updated ${purchasesUpdated} purchases.\n`);

        // Step 6: Update Payments.paidBy
        console.log('📋 Step 6: Updating Payments.paidBy...');
        const payments = await Payments.find({});
        for (const payment of payments) {
            try {
                const userId = payment.paidBy.toString();
                if (userToPartyMap.has(userId)) {
                    payment.paidBy = userToPartyMap.get(userId);
                    await payment.save();
                    paymentsUpdated++;
                }
            } catch (error) {
                console.error(`❌ Error updating payment ${payment._id}:`, error.message);
            }
        }
        console.log(`✅ Updated ${paymentsUpdated} payments.\n`);

        // Summary
        console.log('='.repeat(50));
        console.log('📊 Migration Summary:');
        console.log('='.repeat(50));
        console.log(`Parties created: ${partiesCreated}`);
        console.log(`Sales updated: ${salesUpdated}`);
        console.log(`Returns updated: ${returnsUpdated}`);
        console.log(`Purchases updated: ${purchasesUpdated}`);
        console.log(`Payments updated: ${paymentsUpdated}`);
        console.log(`Total records updated: ${salesUpdated + returnsUpdated + purchasesUpdated + paymentsUpdated}`);
        console.log('='.repeat(50));
        console.log('\n✅ Migration completed successfully!');
        console.log('⚠️  Note: User data has been preserved. No users were deleted.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
};

// Run migration if called directly
if (require.main === module) {
    migrateParties();
}

module.exports = migrateParties;

