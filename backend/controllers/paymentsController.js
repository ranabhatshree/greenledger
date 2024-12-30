const Payments = require("../models/Payments");
const User = require("../models/User");
const {
  createPaymentSchema,
  updatePaymentSchema,
} = require("../validators/paymentsValidator");

// Create Payment
const createPayment = async (req, res) => {
  try {
    const { error, value } = createPaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Destructuring the validated value using the spread operator
    const { ...paymentData } = value;

    // Validate if the payer exists
    const payer = await User.findById(paymentData.paidBy);
    if (!payer) {
      return res.status(404).json({ message: "Paid by user not found" });
    }

    // Create the payment with the spread operator for payment data
    const payment = new Payments({
      ...paymentData, // Spread the rest of the validated fields
      createdBy: req.user.id, // Populated by `protect` middleware
    });

    await payment.save();
    res.status(201).json({ message: "Payment created successfully", payment });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Update Payment
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updatePaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const payment = await Payments.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    Object.assign(payment, value, { updatedAt: Date.now() });
    await payment.save();

    res.status(200).json({ message: "Payment updated successfully", payment });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// View All Payments
const viewPayments = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res
        .status(400)
        .json({ message: "Both 'from' and 'to' dates are required." });
    }

    const payments = await Payments.find({
      invoiceDate: { $gte: new Date(from), $lte: new Date(to) },
    })
    .populate("createdBy", "name")
    .populate("paidBy", "name");

    res.status(200).json({ payments });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Get Payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payments.findById(id)
      .populate("createdBy", "name")
      .populate("paidBy", "name");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json({ payment });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

// Delete Payment
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payments.findById(id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    await payment.remove();
    res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    next(error); // Forward the error to the error handler middleware
  }
};

module.exports = {
  createPayment,
  updatePayment,
  viewPayments,
  getPaymentById,
  deletePayment,
};
