const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const ExpenseCategories = require('../models/ExpenseCategories');
const Expenses = require('../models/Expenses');
const Payments = require('../models/Payments');
const Products = require('../models/Products');
const Purchases = require('../models/Purchases');
const Returns = require('../models/Returns');
const Sales = require('../models/Sales');

/**
 * Migration script to add companyId to existing records
 * This script assigns companyId from the user's companyId for records created by that user
 * For records without a createdBy field, it assigns the first company found
 */
const migrateCompanyId = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all companies
    const Company = require('../models/Company');
    const companies = await Company.find({});
    
    if (companies.length === 0) {
      console.log('No companies found. Please create a company first.');
      process.exit(1);
    }

    const defaultCompanyId = companies[0]._id;
    console.log(`Using default company: ${companies[0].name} (${defaultCompanyId})`);

    let updatedCount = 0;

    // 1. Migrate ExpenseCategories
    console.log('\nMigrating ExpenseCategories...');
    const expenseCategories = await ExpenseCategories.find({ companyId: { $exists: false } });
    for (const category of expenseCategories) {
      let companyId = defaultCompanyId;
      
      // Try to get companyId from createdBy user
      if (category.createdBy) {
        const creator = await User.findById(category.createdBy);
        if (creator && creator.companyId) {
          companyId = creator.companyId;
        }
      }
      
      category.companyId = companyId;
      await category.save();
      updatedCount++;
    }
    console.log(`Updated ${expenseCategories.length} ExpenseCategories`);

    // 2. Migrate Expenses
    console.log('\nMigrating Expenses...');
    const expenses = await Expenses.find({ companyId: { $exists: false } });
    for (const expense of expenses) {
      let companyId = defaultCompanyId;
      
      if (expense.createdBy) {
        const creator = await User.findById(expense.createdBy);
        if (creator && creator.companyId) {
          companyId = creator.companyId;
        }
      }
      
      expense.companyId = companyId;
      await expense.save();
      updatedCount++;
    }
    console.log(`Updated ${expenses.length} Expenses`);

    // 3. Migrate Payments
    console.log('\nMigrating Payments...');
    const payments = await Payments.find({ companyId: { $exists: false } });
    for (const payment of payments) {
      let companyId = defaultCompanyId;
      
      if (payment.createdBy) {
        const creator = await User.findById(payment.createdBy);
        if (creator && creator.companyId) {
          companyId = creator.companyId;
        }
      }
      
      payment.companyId = companyId;
      await payment.save();
      updatedCount++;
    }
    console.log(`Updated ${payments.length} Payments`);

    // 4. Migrate Products
    console.log('\nMigrating Products...');
    const products = await Products.find({ companyId: { $exists: false } });
    for (const product of products) {
      // Products don't have createdBy, so assign default company
      product.companyId = defaultCompanyId;
      await product.save();
      updatedCount++;
    }
    console.log(`Updated ${products.length} Products`);

    // 5. Migrate Purchases
    console.log('\nMigrating Purchases...');
    const purchases = await Purchases.find({ companyId: { $exists: false } });
    for (const purchase of purchases) {
      let companyId = defaultCompanyId;
      
      if (purchase.createdBy) {
        const creator = await User.findById(purchase.createdBy);
        if (creator && creator.companyId) {
          companyId = creator.companyId;
        }
      }
      
      purchase.companyId = companyId;
      await purchase.save();
      updatedCount++;
    }
    console.log(`Updated ${purchases.length} Purchases`);

    // 6. Migrate Returns
    console.log('\nMigrating Returns...');
    const returns = await Returns.find({ companyId: { $exists: false } });
    for (const returnEntry of returns) {
      let companyId = defaultCompanyId;
      
      if (returnEntry.createdBy) {
        const creator = await User.findById(returnEntry.createdBy);
        if (creator && creator.companyId) {
          companyId = creator.companyId;
        }
      }
      
      returnEntry.companyId = companyId;
      await returnEntry.save();
      updatedCount++;
    }
    console.log(`Updated ${returns.length} Returns`);

    // 7. Migrate Sales
    console.log('\nMigrating Sales...');
    const sales = await Sales.find({ companyId: { $exists: false } });
    for (const sale of sales) {
      let companyId = defaultCompanyId;
      
      if (sale.createdBy) {
        const creator = await User.findById(sale.createdBy);
        if (creator && creator.companyId) {
          companyId = creator.companyId;
        }
      }
      
      sale.companyId = companyId;
      await sale.save();
      updatedCount++;
    }
    console.log(`Updated ${sales.length} Sales`);

    console.log(`\n✅ Migration completed! Updated ${updatedCount} records total.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

// Run migration if called directly
if (require.main === module) {
  migrateCompanyId();
}

module.exports = migrateCompanyId;

