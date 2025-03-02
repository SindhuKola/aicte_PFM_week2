import Transaction from "../models/TransactionModel.js";
import User from "../models/UserSchema.js";
import moment from "moment";

export const addTransactionController = async (req, res) => {
  try {
    const { title, amount, description, date, category, userId, transactionType } = req.body;

    if (!title || !amount || !description || !date || !category || !transactionType) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const newTransaction = new Transaction({ title, amount, category, description, date, user: userId, transactionType });

    await newTransaction.save();
    user.transactions.push(newTransaction._id);
    await user.save();

    return res.status(201).json({ success: true, message: "Transaction added successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllTransactionController = async (req, res) => {
  try {
    const { userId, type, frequency, startDate, endDate } = req.body;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const query = { user: userId };
    if (type !== "all") query.transactionType = type;

    if (frequency !== "custom") {
      query.date = { $gt: moment().subtract(Number(frequency), "days").toDate() };
    } else if (startDate && endDate) {
      query.date = { $gte: moment(startDate).toDate(), $lte: moment(endDate).toDate() };
    }

    const transactions = await Transaction.find(query).lean();

    return res.status(200).json({ success: true, transactions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteTransactionController = async (req, res) => {
  try {
    const { id: transactionId } = req.params;
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const transaction = await Transaction.findByIdAndDelete(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    user.transactions = user.transactions.filter((id) => id.toString() !== transactionId);
    await user.save();

    return res.status(200).json({ success: true, message: "Transaction deleted successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateTransactionController = async (req, res) => {
  try {
    const { id: transactionId } = req.params;
    const { title, amount, description, date, category, transactionType } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    Object.assign(transaction, { title, amount, description, date, category, transactionType });
    await transaction.save();

    return res.status(200).json({ success: true, message: "Transaction updated successfully.", transaction });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
