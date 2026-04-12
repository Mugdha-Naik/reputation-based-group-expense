import mongoose from "mongoose";

interface IExpenseReceipt {
  url: string;
  publicId?: string;
  uploadedBy: string;
  uploadedAt: Date;
}

interface IExpense {
  groupId: mongoose.Types.ObjectId;
  title: string;
  category?: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  participants?: string[];
  paymentMethod?: "UPI" | "Cash";
  billImage?: string;

  // 🔥 Cloudinary uploads
  receipts?: IExpenseReceipt[];

  // 🧠 Validation result (ADDED)
  paymentProof?: {
    url: string;
    uploadedBy: string;
    uploadedAt: Date;
    validationStatus: "approved" | "rejected";
    validationReason?: string;
    validatedAt?: Date;
    detectedAmount?: number;
  };

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
    category: {
      type: String,
      trim: true,
      default: undefined,
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
        validator: (value: string[]) =>
          Array.isArray(value) && value.length > 0,
        message: "splitAmong must contain at least one member id",
      },
    },
    participants: {
      type: [String],
      default: undefined,
    },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Cash"],
    },
    billImage: {
      type: String,
    },

    // 🔥 Receipts
    receipts: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String },
          uploadedBy: { type: String, required: true },
          uploadedAt: { type: Date, required: true },
        },
      ],
      default: undefined,
    },

    // 🧠 Validation proof (ADDED)
    paymentProof: {
      url: { type: String },
      uploadedBy: { type: String },
      uploadedAt: { type: Date },
      validationStatus: {
        type: String,
        enum: ["approved", "rejected"],
      },
      validationReason: { type: String },
      validatedAt: { type: Date },
      detectedAmount: { type: Number },
    },
  },
  { timestamps: true }
);

const Expense =
  mongoose.models.Expense ||
  mongoose.model<IExpense>("Expense", expenseSchema);

export type { IExpense };
export default Expense;