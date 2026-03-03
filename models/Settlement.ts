import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettlement extends Document {
  groupId: mongoose.Types.ObjectId;
  fromUser: mongoose.Types.ObjectId;
  toUser: mongoose.Types.ObjectId;
  amount: number;
  status: "pending" | "completed";
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new mongoose.Schema<ISettlement>(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Prevent self-settlement
SettlementSchema.pre<ISettlement>("validate", function (next) {
  if (this.fromUser.toString() === this.toUser.toString()) {
    return next(new Error("Self-settlement is not allowed"));
  }
  next();
});

const Settlement: Model<ISettlement> =
  mongoose.models.Settlement ||
  mongoose.model<ISettlement>("Settlement", SettlementSchema);

export default Settlement;