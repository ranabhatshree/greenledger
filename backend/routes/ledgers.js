const express = require("express");
const { protect, roleBasedAccess } = require("../middlewares/authMiddleware");
const router = express.Router();
const Sales = require("../models/Sales");
const Party = require("../models/Party");
const Purchases = require("../models/Purchases");
const Payments = require("../models/Payments");
const Returns = require("../models/Returns");
const FiscalYear = require("../models/FiscalYear");
const OpeningBalance = require("../models/OpeningBalance");
const mongoose = require("mongoose");

const DEFAULT_OPENING_BALANCE = { amount: 0, type: "CR" };

const getSignedBalance = (openingBalance) => {
  const amount = openingBalance.amount || 0;
  return openingBalance.type === "DR" ? -amount : amount;
};

const formatBalanceResult = (signedBalance) => ({
  amount: Math.abs(signedBalance),
  type: signedBalance < 0 ? "DR" : "CR",
});

const fetchPartyTransactions = async (companyId, partyId, startDate, endDate) => {
  const dateFilter = { $gte: startDate, $lte: endDate };

  const [sales, purchases, payments, returns] = await Promise.all([
    Sales.find(
      {
        companyId,
        billingParty: partyId,
        invoiceDate: dateFilter,
      },
      "invoiceDate invoiceNumber grandTotal"
    ).lean(),

    Purchases.find(
      {
        companyId,
        suppliedBy: partyId,
        invoiceDate: dateFilter,
      },
      "invoiceDate invoiceNumber amount"
    ).lean(),

    Payments.find(
      {
        companyId,
        paidBy: partyId,
        invoiceDate: dateFilter,
      },
      "invoiceDate invoiceNumber amount receivedOrPaid"
    ).lean(),

    Returns.find(
      {
        companyId,
        returnedBy: partyId,
        $or: [
          { invoiceDate: dateFilter },
          {
            invoiceDate: { $exists: false },
            createdAt: dateFilter,
          },
        ],
      },
      "invoiceDate invoiceNumber amount type description createdAt"
    ).lean(),
  ]);

  const ledgerEntries = [
    ...sales.map((sale) => ({
      date: sale.invoiceDate,
      invoiceNumber: sale.invoiceNumber,
      amount: sale.grandTotal,
      type: "Sales",
      drAmount: sale.grandTotal,
      crAmount: 0,
      particulars: "SALES",
    })),
    ...purchases.map((purchase) => ({
      date: purchase.invoiceDate,
      invoiceNumber: purchase.invoiceNumber,
      amount: purchase.amount,
      type: "Purchases",
      drAmount: 0,
      crAmount: purchase.amount,
      particulars: "PURCHASE",
    })),
    ...payments.map((payment) => ({
      date: payment.invoiceDate,
      invoiceNumber: payment.invoiceNumber,
      amount: payment.amount,
      type: "Payments",
      drAmount: payment.receivedOrPaid ? 0 : payment.amount,
      crAmount: payment.receivedOrPaid ? payment.amount : 0,
      particulars: payment.receivedOrPaid ? "PAYMENT RECEIVED" : "PAYMENT SENT",
    })),
    ...returns.map((returnItem) => {
      const returnType = returnItem.type || "credit_note";
      const isCreditNote = returnType === "credit_note";
      const typeLabel = isCreditNote ? "Credit Note" : "Debit Note";
      const entryDate = returnItem.invoiceDate || returnItem.createdAt;

      return {
        date: entryDate,
        invoiceNumber: returnItem.invoiceNumber,
        amount: returnItem.amount,
        type: `Returns: ${typeLabel}`,
        drAmount: isCreditNote ? 0 : returnItem.amount,
        crAmount: isCreditNote ? returnItem.amount : 0,
        particulars: `RETURNS: ${typeLabel}`,
      };
    }),
  ];

  ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

  const totals = {
    sales: sales.reduce((sum, sale) => sum + sale.grandTotal, 0),
    purchases: purchases.reduce((sum, purchase) => sum + purchase.amount, 0),
    payments: payments.reduce((sum, payment) => sum + payment.amount, 0),
    returns: returns.reduce((sum, returnItem) => sum + returnItem.amount, 0),
  };

  return { ledgerEntries, totals };
};

const buildLedgerWithOpeningBalance = (fiscalYear, openingBalance, transactionEntries) => {
  const openingRow = {
    date: fiscalYear.fromDate,
    invoiceNumber: "",
    amount: openingBalance.amount,
    type: "Opening Balance",
    drAmount: openingBalance.type === "DR" ? openingBalance.amount : 0,
    crAmount: openingBalance.type === "CR" ? openingBalance.amount : 0,
    particulars: "Opening Balance",
    isOpeningBalance: true,
  };

  let runningBalance = getSignedBalance(openingBalance);
  openingRow.runningBalance = runningBalance;

  const entriesWithBalance = transactionEntries.map((entry) => {
    runningBalance = runningBalance + entry.crAmount - entry.drAmount;
    return { ...entry, runningBalance };
  });

  return {
    entries: [openingRow, ...entriesWithBalance],
    closing_balance: formatBalanceResult(runningBalance),
  };
};

// Get Party Ledger
router.get(
  "/party/:partyId",
  protect,
  roleBasedAccess(["staff", "admin", "superadmin"]),
  async (req, res) => {
    try {
      const { partyId } = req.params;
      const { from, to, fiscal_year_id: fiscalYearId } = req.query;

      const party = await Party.findOne({ _id: partyId, companyId: req.user.companyId });
      if (!party) {
        return res.status(404).json({
          status: "error",
          message: "Party not found",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(partyId)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid party ID format",
        });
      }

      let startDate;
      let endDate;
      let fiscalYear = null;
      let openingBalance = DEFAULT_OPENING_BALANCE;

      if (fiscalYearId) {
        if (!mongoose.Types.ObjectId.isValid(fiscalYearId)) {
          return res.status(400).json({
            status: "error",
            message: "Invalid fiscal year ID format",
          });
        }

        fiscalYear = await FiscalYear.findOne({
          _id: fiscalYearId,
          companyId: req.user.companyId,
        });

        if (!fiscalYear) {
          return res.status(404).json({
            status: "error",
            message: "Fiscal year not found",
          });
        }

        startDate = new Date(fiscalYear.fromDate);
        endDate = new Date(fiscalYear.toDate);
        endDate.setHours(23, 59, 59, 999);

        const existingOpeningBalance = await OpeningBalance.findOne({
          companyId: req.user.companyId,
          partyId,
          fiscalYearId,
        });

        if (existingOpeningBalance) {
          openingBalance = {
            amount: existingOpeningBalance.amount,
            type: existingOpeningBalance.type,
          };
        }
      } else {
        if (!from || !to) {
          return res.status(400).json({
            status: "error",
            message: "Both 'from' and 'to' dates are required when fiscal_year_id is not provided",
          });
        }

        startDate = new Date(from);
        endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);

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
      }

      const { ledgerEntries, totals } = await fetchPartyTransactions(
        req.user.companyId,
        partyId,
        startDate,
        endDate
      );

      if (fiscalYear) {
        const { entries, closing_balance } = buildLedgerWithOpeningBalance(
          fiscalYear,
          openingBalance,
          ledgerEntries
        );

        return res.status(200).json({
          status: "success",
          message: "Ledger data retrieved successfully",
          data: {
            fiscal_year: fiscalYear,
            opening_balance: openingBalance,
            entries,
            closing_balance,
            totals,
            dateRange: {
              from: startDate,
              to: endDate,
            },
          },
        });
      }

      res.status(200).json({
        status: "success",
        message: "Ledger data retrieved successfully",
        data: {
          entries: ledgerEntries,
          totals,
          dateRange: {
            from: startDate,
            to: endDate,
          },
        },
      });
    } catch (error) {
      console.error("Ledger data fetch error:", {
        timestamp: new Date(),
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        status: "error",
        message: "Failed to fetch ledger data",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
);

module.exports = router;
