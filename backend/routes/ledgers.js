const express = require("express");
const { protect, roleBasedAccess } = require("../middlewares/authMiddleware");
const router = express.Router();
const Sales = require("../models/Sales");
const Expenses = require("../models/Expenses");
const Party = require("../models/Party");
const Purchases = require("../models/Purchases");
const Payments = require("../models/Payments");
const Returns = require("../models/Returns");
const moment = require("moment"); // Use moment.js or any date utility library
const mongoose = require("mongoose")

// Get Party Ledger
router.get(
  "/party/:partyId",
  protect,
  roleBasedAccess(["staff", "admin", "superadmin"]),
  async (req, res) => {
    try {
      const { partyId } = req.params;
      const { from, to } = req.query;

      // Check if party exists and belongs to the same company
      const party = await Party.findOne({ _id: partyId, companyId: req.user.companyId });
      if (!party) {
        return res.status(404).json({
          status: "error",
          message: "Party not found"
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

      // Validate partyId
      if (!mongoose.Types.ObjectId.isValid(partyId)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid party ID format",
        });
      }

      // Check if any transactions exist for this party with correct field names (filtered by company)
      const [hasPartySales, hasPartyPurchases, hasPartyPayments, hasPartyReturns] = await Promise.all([
        Sales.exists({ 
          companyId: req.user.companyId, // Filter by company
          billingParty: partyId,
          invoiceDate: { $gte: startDate, $lte: endDate },
        }),
        Purchases.exists({ 
          companyId: req.user.companyId, // Filter by company
          suppliedBy: partyId,
          invoiceDate: { $gte: startDate, $lte: endDate },
        }),
        Payments.exists({ 
          companyId: req.user.companyId, // Filter by company
          paidBy: partyId,
          invoiceDate: { $gte: startDate, $lte: endDate },
        }),
        Returns.exists({ 
          companyId: req.user.companyId, // Filter by company
          returnedBy: partyId,
          createdAt: { $gte: startDate, $lte: endDate }
        })
      ]);

      // If no transactions exist at all, return early
      if (!hasPartySales && !hasPartyPurchases && !hasPartyPayments && !hasPartyReturns) {
        return res.status(404).json({
          status: "error",
          message: "No transactions found for this party in the specified date range"
        });
      }

      // Fetch data from collections where transactions exist
      const [sales, purchases, payments, returns] = await Promise.all([
        hasPartySales ? Sales.find(
          {
            companyId: req.user.companyId, // Filter by company
            billingParty: partyId,
            invoiceDate: { $gte: startDate, $lte: endDate },
          },
          "invoiceDate invoiceNumber grandTotal"
        ).lean() : [],

        hasPartyPurchases ? Purchases.find(
          {
            companyId: req.user.companyId, // Filter by company
            suppliedBy: partyId,
            invoiceDate: { $gte: startDate, $lte: endDate },
          },
          "invoiceDate invoiceNumber amount"
        ).lean() : [],

        hasPartyPayments ? Payments.find(
          {
            companyId: req.user.companyId, // Filter by company
            paidBy: partyId,
            invoiceDate: { $gte: startDate, $lte: endDate },
          },
          "invoiceDate invoiceNumber amount receivedOrPaid"
        ).lean() : [],

        hasPartyReturns ? Returns.find(
          {
            companyId: req.user.companyId, // Filter by company
            returnedBy: partyId,
            createdAt: { $gte: startDate, $lte: endDate },
          },
          "createdAt invoiceNumber amount description"
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
        })),
        ...returns.map(returnItem => ({
          date: returnItem.createdAt,
          invoiceNumber: returnItem.invoiceNumber,
          amount: returnItem.amount,
          type: "Returns",
          drAmount: 0,
          crAmount: returnItem.amount,
          particulars: `RETURN: ${returnItem.description}`
        }))
      ];

      // Sort entries by date
      ledgerEntries.sort((a, b) => a.date - b.date);

      // Calculate totals
      const totals = {
        sales: sales.reduce((sum, sale) => sum + sale.grandTotal, 0),
        purchases: purchases.reduce((sum, purchase) => sum + purchase.amount, 0),
        payments: payments.reduce((sum, payment) => sum + payment.amount, 0),
        returns: returns.reduce((sum, returnItem) => sum + returnItem.amount, 0)
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
