const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Company = require('../models/Company');

/**
 * Script to fix users who own companies but don't have companyId set
 */
const fixUserCompanyId = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all companies
    const companies = await Company.find({});
    console.log(`Found ${companies.length} companies\n`);

    let updatedCount = 0;

    for (const company of companies) {
      // Find the owner user
      const owner = await User.findById(company.ownerId);
      
      if (!owner) {
        console.log(`⚠️  Company ${company.companyName} has invalid ownerId: ${company.ownerId}`);
        continue;
      }

      // Check if user already has companyId set
      if (owner.companyId && owner.companyId.toString() === company._id.toString()) {
        console.log(`✓ User ${owner.name} already has correct companyId`);
        continue;
      }

      // Update user's companyId
      owner.companyId = company._id;
      await owner.save();
      updatedCount++;
      console.log(`✅ Updated user ${owner.name} (${owner._id}) with companyId: ${company.companyName} (${company._id})`);
    }

    // Also check for users without companyId who might own companies
    const usersWithoutCompanyId = await User.find({ 
      $or: [
        { companyId: { $exists: false } },
        { companyId: null }
      ]
    });

    console.log(`\n📋 Found ${usersWithoutCompanyId.length} users without companyId`);
    
    for (const user of usersWithoutCompanyId) {
      // Check if user owns a company
      const ownedCompany = await Company.findOne({ ownerId: user._id });
      
      if (ownedCompany) {
        user.companyId = ownedCompany._id;
        await user.save();
        updatedCount++;
        console.log(`✅ Updated user ${user.name} (${user._id}) with companyId from owned company: ${ownedCompany.companyName}`);
      }
    }

    console.log('\n==================================================');
    console.log('📋 Migration Summary:');
    console.log('==================================================');
    console.log(`Total users updated: ${updatedCount}`);
    console.log('==================================================\n');

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  fixUserCompanyId();
}

module.exports = fixUserCompanyId;

