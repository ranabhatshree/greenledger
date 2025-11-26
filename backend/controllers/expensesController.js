const Expenses = require("../models/Expenses");
const ExpenseCategory = require("../models/ExpenseCategories"); // Add this import
const {
  createExpenseSchema,
  updateExpenseSchema,
} = require("../validators/expensesValidator");

// Create Expense
const createExpense = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createExpenseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check if expense category exists and belongs to the same company
    const categoryExists = await ExpenseCategory.findOne({ 
      _id: value.category, 
      companyId: req.user.companyId 
    });
    if (!categoryExists) {
      return res.status(404).json({ message: "Expense category not found" });
    }

    // Create and save expense
    const expense = new Expenses({
      ...value,
      companyId: req.user.companyId, // Set companyId from authenticated user
      createdBy: req.user.id, // Populated by `protect` middleware
    });

    await expense.save();
    res.status(201).json({ message: "Expense created successfully", expense });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Update Expense
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateExpenseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const expense = await Expenses.findOne({ _id: id, companyId: req.user.companyId });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    Object.assign(expense, value, { updatedAt: Date.now() });
    await expense.save();

    res.status(200).json({ message: "Expense updated successfully", expense });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// View All Expenses
const viewExpenses = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res
        .status(400)
        .json({ message: "Both 'from' and 'to' dates are required." });
    }

    const expenses = await Expenses.find({
      companyId: req.user.companyId, // Filter by company
      invoiceDate: { $gte: new Date(from), $lte: new Date(to) },
    })
      .populate("category", "name")
      .populate("createdBy", "name")
      .sort({ invoiceDate: 1, invoiceNumber: 1 });

    res.status(200).json({ expenses });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Get Expense by ID
const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expenses.findOne({ _id: id, companyId: req.user.companyId })
      .populate("category", "name")
      .populate("createdBy", "name");
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.status(200).json({ expense });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Delete Expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expenses.findOne({ _id: id, companyId: req.user.companyId });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await expense.deleteOne();
    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

module.exports = {
  createExpense,
  updateExpense,
  viewExpenses,
  getExpenseById,
  deleteExpense,
};
