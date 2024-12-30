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

// Get Party Ledger
router.get(
  "/party/:userId",
  protect,
  roleBasedAccess(["staff", "admin", "superadmin"]),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { from, to } = req.query;

      // Check if user exists
      const user = await Users.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found"
        });
      }

      // Check if from and to dates are provided
      if (!from || !to) {
        return res.status(400).json({
          status: "error",
          message: "Both 'from' and 'to' dates are required",
        });
      }

      // Validate dates
      const startDate = new Date(from);
      const endDate = new Date(to);

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

      // Validate userId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid user ID format",
        });
      }

      // Check if any transactions exist for this user with correct field names
      const [hasUserSales, hasUserPurchases, hasUserPayments] = await Promise.all([
        Sales.exists({ 
          billingParty: userId,
          invoiceDate: { $gte: startDate, $lte: endDate },
          status: { $ne: "cancelled" }
        }),
        Purchases.exists({ 
          suppliedBy: userId,
          invoiceDate: { $gte: startDate, $lte: endDate },
          status: { $ne: "cancelled" }
        }),
        Payments.exists({ 
          paidBy: userId,
          invoiceDate: { $gte: startDate, $lte: endDate },
          status: { $ne: "cancelled" }
        })
      ]);

      // If no transactions exist at all, return early
      if (!hasUserSales && !hasUserPurchases && !hasUserPayments) {
        return res.status(404).json({
          status: "error",
          message: "No transactions found for this user in the specified date range"
        });
      }

      // Fetch data from collections where transactions exist
      const [sales, purchases, payments] = await Promise.all([
        hasUserSales ? Sales.find(
          {
            billingParty: userId,
            invoiceDate: { $gte: startDate, $lte: endDate },
            status: { $ne: "cancelled" },
          },
          "invoiceDate invoiceNumber grandTotal"
        ).lean() : [],

        hasUserPurchases ? Purchases.find(
          {
            suppliedBy: userId,
            invoiceDate: { $gte: startDate, $lte: endDate },
            status: { $ne: "cancelled" },
          },
          "invoiceDate invoiceNumber amount"
        ).lean() : [],

        hasUserPayments ? Payments.find(
          {
            paidBy: userId,
            invoiceDate: { $gte: startDate, $lte: endDate },
            status: { $ne: "cancelled" },
          },
          "invoiceDate invoiceNumber amount receivedOrPaid"
        ).lean() : []
      ]);

      // Transform and combine the data
      const ledgerEntries = [
        ...sales.map(sale => ({
          date: sale.invoiceDate,
          invoiceNumber: sale.invoiceNumber,
          amount: sale.grandTotal,
          type: "Sales",
          drAmount: sale.grandTotal,
          crAmount: 0,
          particulars: "SALES"
        })),
        ...purchases.map(purchase => ({
          date: purchase.invoiceDate,
          invoiceNumber: purchase.invoiceNumber,
          amount: purchase.amount,
          type: "Purchases",
          drAmount: 0,
          crAmount: purchase.amount,
          particulars: "PURCHASE"
        })),
        ...payments.map(payment => ({
          date: payment.invoiceDate,
          invoiceNumber: payment.invoiceNumber,
          amount: payment.amount,
          type: "Payments",
          drAmount: payment.receivedOrPaid ? 0 : payment.amount,
          crAmount: payment.receivedOrPaid ? payment.amount : 0 ,
          particulars: payment.receivedOrPaid ? "PAYMENT RECEIVED" : "PAYMENT SENT",
        }))
      ];

      // Sort entries by date
      ledgerEntries.sort((a, b) => a.date - b.date);

      // Calculate totals
      const totals = {
        sales: sales.reduce((sum, sale) => sum + sale.grandTotal, 0),
        purchases: purchases.reduce((sum, purchase) => sum + purchase.amount, 0),
        payments: payments.reduce((sum, payment) => sum + payment.amount, 0)
      };

      res.status(200).json({
        status: "success",
        message: "Ledger data retrieved successfully",
        data: {
          entries: ledgerEntries,
          totals,
          dateRange: {
            from: startDate,
            to: endDate
          }
        }
      });

    } catch (error) {
      console.error("Ledger data fetch error:", {
        timestamp: new Date(),
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        status: "error",
        message: "Failed to fetch ledger data",
        error: process.env.NODE_ENV === "development" 
          ? error.message 
          : "Internal server error"
      });
    }
  }
);

module.exports = router;
