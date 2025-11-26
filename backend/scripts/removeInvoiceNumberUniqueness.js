const mongoose = require('mongoose');
require('dotenv').config();

const Sales = require('../models/Sales');
const Expenses = require('../models/Expenses');
const Purchases = require('../models/Purchases');

async function removeInvoiceNumberUniqueness() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Drop unique indexes on invoiceNumber
    console.log('\n📋 Dropping unique indexes on invoiceNumber...');

    // Drop from Sales collection
    try {
      await Sales.collection.dropIndex('invoiceNumber_1');
      console.log('✅ Dropped unique index from Sales collection');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  No unique index found on Sales.invoiceNumber (may have been already removed)');
      } else {
        console.error('❌ Error dropping index from Sales:', error.message);
      }
    }

    // Drop from Expenses collection
    try {
      await Expenses.collection.dropIndex('invoiceNumber_1');
      console.log('✅ Dropped unique index from Expenses collection');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  No unique index found on Expenses.invoiceNumber (may have been already removed)');
      } else {
        console.error('❌ Error dropping index from Expenses:', error.message);
      }
    }

    // Drop from Purchases collection
    try {
      await Purchases.collection.dropIndex('invoiceNumber_1');
      console.log('✅ Dropped unique index from Purchases collection');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  No unique index found on Purchases.invoiceNumber (may have been already removed)');
      } else {
        console.error('❌ Error dropping index from Purchases:', error.message);
      }
    }

    // Verify indexes were removed
    console.log('\n📋 Verifying indexes...');
    const salesIndexes = await Sales.collection.indexes();
    const expensesIndexes = await Expenses.collection.indexes();
    const purchasesIndexes = await Purchases.collection.indexes();

    console.log('\nSales indexes:', salesIndexes.map(idx => ({ name: idx.name, unique: idx.unique || false })));
    console.log('Expenses indexes:', expensesIndexes.map(idx => ({ name: idx.name, unique: idx.unique || false })));
    console.log('Purchases indexes:', purchasesIndexes.map(idx => ({ name: idx.name, unique: idx.unique || false })));

    console.log('\n✅ Successfully removed invoiceNumber uniqueness constraints!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the script
removeInvoiceNumberUniqueness();

