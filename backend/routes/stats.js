const express = require("express");
const { protect, roleBasedAccess } = require("../middlewares/authMiddleware");
const router = express.Router();
const Sales = require("../models/Sales");
const Expenses = require("../models/Expenses");
const Users = require("../models/User");
const Purchases = require("../models/Purchases");
const Payments = require("../models/Payments");
const moment = require("moment"); // Use moment.js or any date utility library
const mongoose = require("mongoose")

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

      // Parallel execution of all aggregation queries for better performance
      const [salesResult, expensesResult, partiesCount, purchasesResult] =
        await Promise.all([
          // Sales aggregation
          Sales.aggregate([
            {
              $match: {
                invoiceDate: { $gte: startDate, $lte: endDate },
                status: { $ne: "cancelled" }, // Exclude cancelled sales
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
                invoiceDate: { $gte: startDate, $lte: endDate },
                status: { $ne: "void" }, // Exclude void expenses
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

          // Active parties count
          Users.countDocuments({
            role: { $in: ["vendor", "supplier"] },
          }),

          // Purchases aggregation
          Purchases.aggregate([
            {
              $match: {
                invoiceDate: { $gte: startDate, $lte: endDate },
                status: { $ne: "cancelled" }, // Exclude cancelled purchases
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

      // Aggregate sales data
      const salesData = await Sales.aggregate([
        {
          $match: {
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

      // Get all vendors/suppliers first
      const vendors = await Users.find({
        role: { $in: ["vendor", "supplier"] },
      }).select("_id name businessName");

      // Create a map of vendor IDs to names
      const vendorMap = new Map(
        vendors.map((v) => [v._id.toString(), v.businessName || v.name])
      );

      // Get current period sales
      const currentPeriodSales = await Sales.aggregate([
        {
          $match: {
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
            vendorName: vendorMap.get(vendorId) || "Unknown Vendor",
            sales: Math.round(vendor.currentSales),
            growth: Number(growth.toFixed(1)),
            totalTransactions: vendor.totalTransactions,
            averageTransactionValue: Math.round(vendor.averageTransactionValue),
            previousPeriodSales: Math.round(previousSales),
          };
        })
        .filter((vendor) => vendor.vendorName !== "Unknown Vendor") // Remove unknown vendors
        .sort((a, b) => b.sales - a.sales)
        .slice(0, parseInt(limit));

      console.log(vendorsWithGrowth)

      res.status(200).json({
        status: "success",
        message: "Top vendors retrieved successfully",
        data: vendorsWithGrowth,
        metadata: {
          totalVendors: vendors.length,
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

router.get('/recent-transactions', async (req, res) => {
  try {
      // Fetch latest 3 sales
      const sales = await Sales.find({})
          .sort({ invoiceDate: -1 })
          .limit(3)
          .select('invoiceDate invoiceNumber billingParty grandTotal')
          .lean();

      // Resolve billingParty to name if it is an ObjectId
      const salesData = await Promise.all(sales.map(async (sale) => {
          let customerName;
          if (mongoose.Types.ObjectId.isValid(sale.billingParty)) {
              const user = await Users.findById(sale.billingParty).select('name').lean();
              customerName = user ? user.name : 'Unknown Customer';
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

      // Fetch latest 3 expenses
      const expenses = await Expenses.find({})
          .sort({ invoiceDate: -1 })
          .limit(3)
          .select('invoiceDate invoiceNumber amount category description')
          .lean();

      const expensesData = expenses.map(expense => ({
          ...expense,
          type: "Expense"
      }));

      // Fetch latest 3 purchases
      const purchases = await Purchases.find({})
          .sort({ invoiceDate: -1 })
          .limit(3)
          .select('invoiceDate invoiceNumber amount category description')
          .lean();

      const purchasesData = purchases.map(purchase => ({
          ...purchase,
          type: "Purchase"
      }));

            // Fetch latest 3 purchases
            const payments = await Payments.find({})
            .sort({ paymentReceivedDate: -1 })
            .limit(3)
            .select({
                invoiceNumber: 1,
                amount: 1,
                description: 1,
                invoiceDate: '$paymentReceivedDate' // Alias paymentReceivedDate as invoiceDate
            })
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


module.exports = router;
