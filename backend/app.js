const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Import cors middleware
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const salesRoutes = require('./routes/sales');
const expensesRoutes = require('./routes/expenses');
const purchasesRoutes = require('./routes/purchases');
const returnsRoutes = require('./routes/returns');
const paymentsRoutes = require('./routes/payments');
const productsRoutes = require('./routes/products');
const expenseCategorieRoutes = require('./routes/expenseCategories');
const partiesRoutes = require('./routes/parties');
const helperRoute = require('./routes/helper');
const statsRoute = require('./routes/stats');
const ledgersRoute = require('./routes/ledgers');
const apiLimiter = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();


// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Connect to MongoDB
connectDB().then(() => {
    // Seed Permissions and System Roles
    //const seedPermissions = require('./seeds/seedPermissions');
    //seedPermissions().catch(err => console.error("Seeding failed", err));
});

app.get('/', (req, res) => res.send('✅ Backend is running properly'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', require('./routes/userRoutes')); // New user routes
app.use('/api/onboarding', require('./routes/onboardingRoutes')); // New onboarding routes
app.use('/api/roles', require('./routes/roleRoutes')); // New role routes
app.use('/api/permissions', require('./routes/permissionRoutes')); // New permission routes
app.use('/api/settings', require('./routes/userSettingsRoutes')); // New settings routes
app.use('/api/company-settings', require('./routes/companySettingsRoutes')); // Company settings routes
app.use('/api/profile', require('./routes/userProfileRoutes')); // User profile routes
app.use('/api/sales', salesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/expensecategories', expenseCategorieRoutes);
app.use('/api/parties', partiesRoutes);
app.use('/api/helper', helperRoute);
app.use('/api/stats', statsRoute);
app.use('/api/ledgers', ledgersRoute);
app.use('/api/bulk-sales', require('./routes/bulkSalesRoutes'));

app.use('/uploads', express.static('uploads'));
app.use(apiLimiter);
app.use(errorHandler);

// Export `app` for testing
module.exports = app;

// Start server except in test environment
if (process.env.NODE_ENV === 'test') {
    module.exports = app; // Export for testing
} else {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
    });
}