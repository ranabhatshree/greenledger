const express = require("express");
const { protect, roleBasedAccess } = require("../middlewares/authMiddleware");
const router = express.Router();
const Sales = require("../models/Sales");
const Expenses = require("../models/Expenses");
const Users = require("../models/User");
const Party = require("../models/Party");
const Purchases = require("../models/Purchases");
const Payments = require("../models/Payments");
const Returns = require("../models/Returns");
const moment = require("moment"); // Use moment.js or any date utility library
const mongoose = require("mongoose")

// Helper function to ensure companyId is properly formatted for MongoDB aggregation queries
// MongoDB aggregation is strict about type matching, so we need to ensure ObjectId format
const getCompanyIdFilter = (companyId) => {
  if (!companyId) {
    return null;
  }
  
  // If it's already an ObjectId instance, return as-is
  if (companyId instanceof mongoose.Types.ObjectId) {
    return companyId;
  }
  
  // If it's a valid ObjectId string, convert it to ObjectId
  if (typeof companyId === 'string' && mongoose.Types.ObjectId.isValid(companyId)) {
    return new mongoose.Types.ObjectId(companyId);
  }
  
  // If it's an object with toString method (Mongoose document), get the string and convert
  if (companyId && typeof companyId.toString === 'function') {
    const idString = companyId.toString();
    if (mongoose.Types.ObjectId.isValid(idString)) {
      return new mongoose.Types.ObjectId(idString);
    }
  }
  
  // Fallback: return as-is (shouldn't happen with proper Mongoose schemas)
  return companyId;
};

// Helper to create a match condition that handles both ObjectId and string companyId formats
// This is useful when data might have been stored in different formats
const createCompanyIdMatch = (companyId) => {
  const companyIdFilter = getCompanyIdFilter(companyId);
  if (!companyIdFilter) {
    return {};
  }
  
  // Try ObjectId first (most common case)
  // MongoDB will automatically match if the stored value is also ObjectId
  return { companyId: companyIdFilter };
};

// Dashboard cards
router.get(
  "/dashboard-cards",
  protect,
  roleBasedAccess(["staff", "admin", "superadmin"]),
  async (req, res) => {
    try {
      // Input validation for date parameters
      const { from, to } = req.query;
      let startDate, endDate;

      try {
        endDate = to ? new Date(to) : new Date();
        startDate = from
          ? new Date(from)
          : moment(endDate).subtract(1, "month").toDate();

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({
            status: "error",
            message:
              "Invalid date format provided. Please use YYYY-MM-DD format.",
          });
        }

        if (startDate > endDate) {
          return res.status(400).json({
            status: "error",
            message: "Start date cannot be later than end date.",
          });
        }
      } catch (dateError) {
        return res.status(400).json({
          status: "error",
          message: "Invalid date parameters provided.",
          details: dateError.message,
        });
      }

      // Debug: Log companyId to help diagnose issues
      if (!req.user || !req.user.companyId) {
        console.warn('Warning: req.user.companyId is missing:', {
          hasUser: !!req.user,
          userId: req.user?._id,
          companyId: req.user?.companyId
        });
      }

      const companyIdFilter = getCompanyIdFilter(req.user?.companyId);
      if (!companyIdFilter) {
        return res.status(400).json({
          status: "error",
          message: "User companyId is required. Please ensure your user account is associated with a company.",
        });
      }

      // Parallel execution of all aggregation queries for better performance
      const [salesResult, expensesResult, partiesCount, purchasesResult] =
        await Promise.all([
          // Sales aggregation
          Sales.aggregate([
            {
              $match: {
                companyId: companyIdFilter,
                invoiceDate: { $gte: startDate, $lte: endDate },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$grandTotal" },
                count: { $sum: 1 },
              },
            },
          ]),

          // Expenses aggregation
          Expenses.aggregate([
            {
              $match: {
                companyId: companyIdFilter,
                invoiceDate: { $gte: startDate, $lte: endDate },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ]),

          // Active parties count (filtered by company)
          Party.countDocuments({
            companyId: companyIdFilter, // Filter by company
          }),

          // Purchases aggregation
          Purchases.aggregate([
            {
              $match: {
                companyId: companyIdFilter,
                invoiceDate: { $gte: startDate, $lte: endDate },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ]),
        ]);

      // Prepare dashboard data with additional metrics
      const dashboardData = {
        sales: {
          total:
            salesResult.length > 0
              ? Number(salesResult[0].total.toFixed(2))
              : 0,
          count: salesResult.length > 0 ? salesResult[0].count : 0,
        },
        expenses: {
          total:
            expensesResult.length > 0
              ? Number(expensesResult[0].total.toFixed(2))
              : 0,
          count: expensesResult.length > 0 ? expensesResult[0].count : 0,
        },
        parties: {
          total: partiesCount,
          activePercentage: partiesCount > 0 ? 100 : 0,
        },
        purchases: {
          total:
            purchasesResult.length > 0
              ? Number(purchasesResult[0].total.toFixed(2))
              : 0,
          count: purchasesResult.length > 0 ? purchasesResult[0].count : 0,
        },
        metrics: {
          profitLoss: Number(
            (
              (salesResult.length > 0 ? salesResult[0].total : 0) -
              (expensesResult.length > 0 ? expensesResult[0].total : 0)
            ).toFixed(2)
          ),
          dateRange: {
            from: startDate,
            to: endDate,
          },
        },
      };

      // Send successful response
      res.status(200).json({
        status: "success",
        message: "Dashboard data retrieved successfully",
        timestamp: new Date(),
        data: dashboardData,
      });
    } catch (error) {
      // Log error for debugging
      console.error("Dashboard data fetch error:", {
        timestamp: new Date(),
        error: error.message,
        stack: error.stack,
      });

      // Send error response
      res.status(500).json({
        status: "error",
        message: "Failed to fetch dashboard data",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
);

// Sales Stats for chart.js
router.get(
  "/sales",
  protect,
  roleBasedAccess(["staff", "admin", "superadmin"]),
  async (req, res) => {
    try {
      // Parse query parameters for date filtering
      const { from, to, groupBy = "day" } = req.query;

      // Default to last 30 days if no date range provided
      const endDate = to ? new Date(to) : new Date();
      const startDate = from
        ? new Date(from)
        : moment(endDate).subtract(30, "days").toDate();

      // Define date grouping format based on groupBy parameter
      let dateFormat;
      let dateGroup;
      switch (groupBy) {
        case "month":
          dateFormat = "%Y-%m";
          dateGroup = {
            $dateToString: { format: "%Y-%m", date: "$invoiceDate" },
          };
          break;
        case "week":
          dateFormat = "%Y-W%V";
          dateGroup = {
            $dateToString: { format: "%Y-W%V", date: "$invoiceDate" },
          };
          break;
        default: // day
          dateFormat = "%Y-%m-%d";
          dateGroup = {
            $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" },
          };
      }

      // Ensure companyId is available
      if (!req.user || !req.user.companyId) {
        return res.status(400).json({
          message: "User companyId is required",
        });
      }

      const companyIdFilter = getCompanyIdFilter(req.user.companyId);
      if (!companyIdFilter) {
        return res.status(400).json({
          message: "Invalid companyId format",
        });
      }

      // Aggregate sales data
      const salesData = await Sales.aggregate([
        {
          $match: {
            companyId: companyIdFilter, // Filter by company
            invoiceDate: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: dateGroup,
            totalSales: { $sum: "$grandTotal" },
            averageOrderValue: { $avg: "$grandTotal" },
            orderCount: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            date: "$_id",
            totalSales: { $round: ["$totalSales", 2] },
            averageOrderValue: { $round: ["$averageOrderValue", 2] },
            orderCount: 1,
            _id: 0,
          },
        },
      ]);

      // Fill in missing dates with zero values
      const filledData = [];
      let currentDate = moment(startDate);
      const end = moment(endDate);

      while (currentDate <= end) {
        const dateStr = currentDate.format(
          groupBy === "month"
            ? "YYYY-MM"
            : groupBy === "week"
            ? "YYYY-[W]WW"
            : "YYYY-MM-DD"
        );

        const existingData = salesData.find(
          (item) => item.date === dateStr
        ) || {
          date: dateStr,
          totalSales: 0,
          averageOrderValue: 0,
          orderCount: 0,
        };

        filledData.push(existingData);

        currentDate = currentDate.add(1, groupBy);
      }

      // Calculate additional metrics
      const metrics = {
        totalRevenue: salesData.reduce((sum, item) => sum + item.totalSales, 0),
        averageOrderValue:
          salesData.reduce((sum, item) => sum + item.averageOrderValue, 0) /
          (salesData.length || 1),
        totalOrders: salesData.reduce((sum, item) => sum + item.orderCount, 0),
      };

      res.status(200).json({
        message: "Sales analytics data retrieved successfully",
        data: filledData,
        metrics,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      });
    } catch (error) {
      console.error("Error fetching sales analytics:", error);
      res.status(500).json({
        message: "Failed to fetch sales analytics data",
        error: error.message,
      });
    }
  }
);

router.get(
  "/top-vendors",
  protect,
  roleBasedAccess(["staff", "admin", "superadmin"]),
  async (req, res) => {
    try {
      const { limit = 5 } = req.query;
      const endDate = new Date();
      const startDate = moment(endDate).subtract(1, "month").toDate();
      const previousStartDate = moment(startDate).subtract(1, "month").toDate();

      // Ensure companyId is available
      if (!req.user || !req.user.companyId) {
        return res.status(400).json({
          status: "error",
          message: "User companyId is required",
        });
      }

      const companyIdFilter = getCompanyIdFilter(req.user.companyId);
      if (!companyIdFilter) {
        return res.status(400).json({
          status: "error",
          message: "Invalid companyId format",
        });
      }

      // Get all parties (vendors/suppliers) first (filtered by company)
      const parties = await Party.find({
        companyId: companyIdFilter, // Filter by company
      }).select("_id name");

      // Create a map of party IDs to names
      const partyMap = new Map(
        parties.map((p) => [p._id.toString(), p.name])
      );

      // Get current period sales
      const currentPeriodSales = await Sales.aggregate([
        {
          $match: {
            companyId: companyIdFilter, // Filter by company
            invoiceDate: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $addFields: {
            // Handle both string and ObjectId billingParty
            vendorId: {
              $cond: {
                if: { $eq: [{ $type: "$billingParty" }, "string"] },
                then: "$billingParty",
                else: { $toString: "$billingParty" },
              },
            },
          },
        },
        {
          $group: {
            _id: "$vendorId",
            currentSales: { $sum: "$grandTotal" },
            totalTransactions: { $sum: 1 },
            averageTransactionValue: { $avg: "$grandTotal" },
          },
        },
      ]);

      // Get previous period sales
      const previousPeriodSales = await Sales.aggregate([
        {
          $match: {
            companyId: companyIdFilter, // Filter by company
            invoiceDate: { $gte: previousStartDate, $lte: startDate },
          },
        },
        {
          $addFields: {
            vendorId: {
              $cond: {
                if: { $eq: [{ $type: "$billingParty" }, "string"] },
                then: "$billingParty",
                else: { $toString: "$billingParty" },
              },
            },
          },
        },
        {
          $group: {
            _id: "$vendorId",
            previousSales: { $sum: "$grandTotal" },
          },
        },
      ]);

      // Create a map of previous sales
      const previousSalesMap = new Map(
        previousPeriodSales.map((item) => [
          item._id.toString(),
          item.previousSales,
        ])
      );

      // Combine and calculate growth
      const vendorsWithGrowth = currentPeriodSales
        .map((vendor) => {
          const vendorId = vendor._id.toString();
          const previousSales = previousSalesMap.get(vendorId) || 0;
          const growth =
            previousSales === 0
              ? 100
              : ((vendor.currentSales - previousSales) / previousSales) * 100;

          return {
            vendorName: partyMap.get(vendorId) || "Unknown Party",
            sales: Math.round(vendor.currentSales),
            growth: Number(growth.toFixed(1)),
            totalTransactions: vendor.totalTransactions,
            averageTransactionValue: Math.round(vendor.averageTransactionValue),
            previousPeriodSales: Math.round(previousSales),
          };
        })
        .filter((vendor) => vendor.vendorName !== "Unknown Party") // Remove unknown parties
        .sort((a, b) => b.sales - a.sales)
        .slice(0, parseInt(limit));

      console.log(vendorsWithGrowth)

      res.status(200).json({
        status: "success",
        message: "Top vendors retrieved successfully",
        data: vendorsWithGrowth,
        metadata: {
          totalVendors: parties.length,
          dateRange: {
            from: startDate,
            to: endDate,
          },
          previousPeriod: {
            from: previousStartDate,
            to: startDate,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching top vendors:", {
        timestamp: new Date(),
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        status: "error",
        message: "Failed to fetch top vendors data",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
);

router.get('/recent-transactions', protect, async (req, res) => {
  try {
      // Ensure companyId is available
      if (!req.user || !req.user.companyId) {
        return res.status(400).json({
          status: "error",
          message: "User companyId is required",
        });
      }

      const companyIdFilter = getCompanyIdFilter(req.user.companyId);
      if (!companyIdFilter) {
        return res.status(400).json({
          status: "error",
          message: "Invalid companyId format",
        });
      }

      // Fetch latest 3 sales (filtered by company)
      const sales = await Sales.find({ companyId: companyIdFilter })
          .sort({ invoiceDate: -1 })
          .limit(3)
          .select('invoiceDate invoiceNumber billingParty grandTotal')
          .lean();

      // Resolve billingParty to name if it is an ObjectId
      const salesData = await Promise.all(sales.map(async (sale) => {
          let customerName;
          if (mongoose.Types.ObjectId.isValid(sale.billingParty)) {
              const party = await Party.findOne({ 
                _id: sale.billingParty, 
                companyId: companyIdFilter 
              }).select('name').lean();
              customerName = party ? party.name : 'Unknown Customer';
          } else {
              customerName = sale.billingParty;
          }
          return {
              _id: sale._id,
              invoiceDate: sale.invoiceDate,
              invoiceNumber: sale.invoiceNumber,
              amount: sale.grandTotal,
              description: `Sale for ${customerName}`,
              type: "Sale"
          };
      }));

      // Fetch latest 3 expenses (filtered by company)
      const expenses = await Expenses.find({ companyId: req.user.companyId })
          .sort({ invoiceDate: -1 })
          .limit(3)
          .select('invoiceDate invoiceNumber amount category description')
          .lean();

      const expensesData = expenses.map(expense => ({
          ...expense,
          type: "Expense"
      }));

      // Fetch latest 3 purchases (filtered by company)
      const purchases = await Purchases.find({ companyId: companyIdFilter })
          .sort({ invoiceDate: -1 })
          .limit(3)
          .select('invoiceDate invoiceNumber amount category description')
          .lean();

      const purchasesData = purchases.map(purchase => ({
          ...purchase,
          type: "Purchase"
      }));

            // Fetch latest 3 payments (filtered by company)
            const payments = await Payments.find({ companyId: companyIdFilter })
            .sort({ invoiceDate: -1 })
            .limit(3)
            .select('invoiceDate invoiceNumber amount description')
            .lean();        
  
        const paymentsData = payments.map(purchase => ({
            ...purchase,
            type: "Payment"
        }));

      // Combine all data
      const combinedData = [
          ...salesData,
          ...expensesData,
          ...purchasesData,
          ...paymentsData
      ];

      // Sort combined data by invoiceDate
      combinedData.sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate));

      // Respond with the data
      res.status(200).json({
        message: "Retrieving Latest Transactions!",
        transactions: combinedData
      });
  } catch (error) {
      console.error('Error fetching recent transactions:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Reports API - Comprehensive analytics for reports page
router.get(
  "/reports",
  protect,
  roleBasedAccess(["staff", "admin", "superadmin"]),
  async (req, res) => {
    try {
      const { from, to } = req.query;

      // Validate required date parameters
      if (!from || !to) {
        return res.status(400).json({
          status: "error",
          message: "Both 'from' and 'to' dates are required",
        });
      }

      // Parse and validate dates
      let startDate, endDate;
      try {
        startDate = new Date(from);
        endDate = new Date(to);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({
            status: "error",
            message: "Invalid date format. Please use YYYY-MM-DD format.",
          });
        }

        if (startDate > endDate) {
          return res.status(400).json({
            status: "error",
            message: "Start date cannot be later than end date.",
          });
        }
      } catch (dateError) {
        return res.status(400).json({
          status: "error",
          message: "Invalid date parameters provided.",
          details: dateError.message,
        });
      }

      // Calculate if period is more than 1 month
      const diffInMonths = moment(endDate).diff(moment(startDate), 'months', true);
      const isMoreThanOneMonth = diffInMonths > 1;

      // Ensure companyId is available
      if (!req.user || !req.user.companyId) {
        return res.status(400).json({
          status: "error",
          message: "User companyId is required",
        });
      }

      const companyIdFilter = getCompanyIdFilter(req.user.companyId);
      if (!companyIdFilter) {
        return res.status(400).json({
          status: "error",
          message: "Invalid companyId format",
        });
      }

      // Parallel execution of all aggregation queries for better performance
      const [
        salesResult,
        expensesResult,
        partiesCount,
        purchasesResult,
        paymentsReceivedResult,
        paymentsSentResult,
        returnsResult
      ] = await Promise.all([
        // Sales aggregation (Gross Revenue)
        Sales.aggregate([
          {
            $match: {
              companyId: companyIdFilter, // Filter by company
              invoiceDate: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$grandTotal" },
              count: { $sum: 1 },
            },
          },
        ]),

        // Expenses aggregation
        Expenses.aggregate([
          {
            $match: {
              companyId: companyIdFilter, // Filter by company
              invoiceDate: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ]),

        // Parties count (Vendors & Suppliers) - filtered by company
        Party.countDocuments({
          companyId: companyIdFilter, // Filter by company
        }),

        // Purchases aggregation
        Purchases.aggregate([
          {
            $match: {
              companyId: companyIdFilter, // Filter by company
              invoiceDate: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ]),

        // Payments Received aggregation
        Payments.aggregate([
          {
            $match: {
              companyId: companyIdFilter, // Filter by company
              invoiceDate: { $gte: startDate, $lte: endDate },
              receivedOrPaid: true,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ]),

        // Payments Sent aggregation
        Payments.aggregate([
          {
            $match: {
              companyId: companyIdFilter, // Filter by company
              invoiceDate: { $gte: startDate, $lte: endDate },
              receivedOrPaid: false,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ]),

        // Returns aggregation
        Returns.aggregate([
          {
            $match: {
              companyId: companyIdFilter, // Filter by company
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      // Extract totals with fallback to 0
      const grossRevenue = salesResult.length > 0 ? salesResult[0].total : 0;
      const expenses = expensesResult.length > 0 ? expensesResult[0].total : 0;
      const purchases = purchasesResult.length > 0 ? purchasesResult[0].total : 0;
      const paymentsReceived = paymentsReceivedResult.length > 0 ? paymentsReceivedResult[0].total : 0;
      const paymentsSent = paymentsSentResult.length > 0 ? paymentsSentResult[0].total : 0;
      const returns = returnsResult.length > 0 ? returnsResult[0].total : 0;
      const netRevenue = grossRevenue - returns;

      // Prepare aggregate metrics
      const metrics = {
        grossRevenue: Number(grossRevenue.toFixed(2)),
        expenses: Number(expenses.toFixed(2)),
        parties: partiesCount,
        purchases: Number(purchases.toFixed(2)),
        paymentsReceived: Number(paymentsReceived.toFixed(2)),
        paymentsSent: Number(paymentsSent.toFixed(2)),
        returns: Number(returns.toFixed(2)),
        netRevenue: Number(netRevenue.toFixed(2)),
        counts: {
          sales: salesResult.length > 0 ? salesResult[0].count : 0,
          expenses: expensesResult.length > 0 ? expensesResult[0].count : 0,
          purchases: purchasesResult.length > 0 ? purchasesResult[0].count : 0,
          paymentsReceived: paymentsReceivedResult.length > 0 ? paymentsReceivedResult[0].count : 0,
          paymentsSent: paymentsSentResult.length > 0 ? paymentsSentResult[0].count : 0,
          returns: returnsResult.length > 0 ? returnsResult[0].count : 0,
        }
      };

      let monthlyBreakdown = null;

      // If period is more than 1 month, generate monthly breakdown
      if (isMoreThanOneMonth) {
        const monthlyData = [];
        let currentMonth = moment(startDate).startOf('month');
        const endMonth = moment(endDate).endOf('month');

        while (currentMonth.isSameOrBefore(endMonth)) {
          const monthStart = currentMonth.toDate();
          const monthEnd = moment(currentMonth).endOf('month').toDate();
          const monthKey = currentMonth.format('YYYY-MM');
          const monthName = currentMonth.format('MMMM YYYY');

          // Parallel execution for monthly data
          const [
            monthlySales,
            monthlyExpenses,
            monthlyPurchases,
            monthlyPaymentsReceived,
            monthlyPaymentsSent,
            monthlyReturns
          ] = await Promise.all([
            Sales.aggregate([
              {
                $match: {
                  companyId: companyIdFilter, // Filter by company
                  invoiceDate: { $gte: monthStart, $lte: monthEnd },
                },
              },
              { $group: { _id: null, total: { $sum: "$grandTotal" } } },
            ]),
            Expenses.aggregate([
              {
                $match: {
                  companyId: companyIdFilter, // Filter by company
                  invoiceDate: { $gte: monthStart, $lte: monthEnd },
                },
              },
              { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
            Purchases.aggregate([
              {
                $match: {
                  companyId: companyIdFilter, // Filter by company
                  invoiceDate: { $gte: monthStart, $lte: monthEnd },
                },
              },
              { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
            Payments.aggregate([
              {
                $match: {
                  companyId: companyIdFilter, // Filter by company
                  invoiceDate: { $gte: monthStart, $lte: monthEnd },
                  receivedOrPaid: true,
                },
              },
              { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
            Payments.aggregate([
              {
                $match: {
                  companyId: companyIdFilter, // Filter by company
                  invoiceDate: { $gte: monthStart, $lte: monthEnd },
                  receivedOrPaid: false,
                },
              },
              { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
            Returns.aggregate([
              {
                $match: {
                  companyId: companyIdFilter, // Filter by company
                  createdAt: { $gte: monthStart, $lte: monthEnd },
                },
              },
              { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
          ]);

          const monthGrossRevenue = monthlySales.length > 0 ? monthlySales[0].total : 0;
          const monthReturns = monthlyReturns.length > 0 ? monthlyReturns[0].total : 0;

          monthlyData.push({
            month: monthKey,
            monthName: monthName,
            grossRevenue: Number(monthGrossRevenue.toFixed(2)),
            expenses: Number((monthlyExpenses.length > 0 ? monthlyExpenses[0].total : 0).toFixed(2)),
            purchases: Number((monthlyPurchases.length > 0 ? monthlyPurchases[0].total : 0).toFixed(2)),
            paymentsReceived: Number((monthlyPaymentsReceived.length > 0 ? monthlyPaymentsReceived[0].total : 0).toFixed(2)),
            paymentsSent: Number((monthlyPaymentsSent.length > 0 ? monthlyPaymentsSent[0].total : 0).toFixed(2)),
            returns: Number(monthReturns.toFixed(2)),
            netRevenue: Number((monthGrossRevenue - monthReturns).toFixed(2)),
          });

          currentMonth.add(1, 'month');
        }

        monthlyBreakdown = monthlyData;
      }

      // Send successful response
      res.status(200).json({
        status: "success",
        message: "Reports data retrieved successfully",
        data: {
          metrics,
          monthlyBreakdown,
          isMoreThanOneMonth,
          dateRange: {
            from: startDate,
            to: endDate,
          },
        },
      });
    } catch (error) {
      console.error("Reports data fetch error:", {
        timestamp: new Date(),
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        status: "error",
        message: "Failed to fetch reports data",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
);


module.exports = router;
