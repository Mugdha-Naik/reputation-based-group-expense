import mongoose from "mongoose";
import Expense from "@/models/Expense";
import Group from "@/models/Group.model";
import Settlement from "@/models/Settlement";
import { generateSettlements } from "./generateSettlements";
import { buildOutstandingBalances } from "./settlementLedger";

export async function rebuildPendingSettlementsForGroup(groupId: string) {
  const group = await Group.findById(groupId).lean();
  if (!group) {
    throw new Error("Group not found");
  }

  const memberIds = (group.members || []).map((member: mongoose.Types.ObjectId) =>
    member.toString()
  );

  const [expenses, completedSettlements] = await Promise.all([
    Expense.find({ groupId }).lean(),
    Settlement.find({ groupId, status: "completed" })
      .select("fromUser toUser amount")
      .lean(),
  ]);

  const balancesMap = buildOutstandingBalances(
    expenses.map((expense) => ({
      title: expense.title,
      amount: expense.amount,
      paidBy: expense.paidBy,
      splitAmong: expense.splitAmong,
    })),
    memberIds,
    completedSettlements.map((settlement) => ({
      fromUser: settlement.fromUser.toString(),
      toUser: settlement.toUser.toString(),
      amount: settlement.amount,
    }))
  );

  const generated = generateSettlements(
    Object.entries(balancesMap).map(([userId, balance]) => ({
      userId,
      balance,
    }))
  );

  await Settlement.deleteMany({ groupId, status: "pending" });

  const created =
    generated.length > 0
      ? await Settlement.insertMany(
          generated.map((item) => ({
            groupId,
            fromUser: item.fromUser,
            toUser: item.toUser,
            amount: item.amount,
            status: "pending" as const,
          }))
        )
      : [];

  return created;
}
