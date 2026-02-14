import mongoose from "mongoose";

interface IExpense {
  groupId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const expenseSchema = new mongoose.Schema<IExpense>(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paidBy: {
      type: String,
      required: true,
      trim: true,
    },
    splitAmong: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => Array.isArray(value) && value.length > 0,
        message: "splitAmong must contain at least one member id",
      },
    },
  },
  { timestamps: true }
);

const Expense =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", expenseSchema);

export type { IExpense };
export default Expense;
