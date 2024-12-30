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

    // Check if expense category exists
    const categoryExists = await ExpenseCategory.findById(value.category);
    if (!categoryExists) {
      return res.status(404).json({ message: "Expense category not found" });
    }

    // Create and save expense
    const expense = new Expenses({
      ...value,
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

    const expense = await Expenses.findById(id);
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

    const expense = await Expenses.findById(id)
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

    const expense = await Expenses.findById(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    await expense.remove();
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
