import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import connectDB from "@/lib/db";
import Group from "@/models/Group.model";
import Expense from "@/models/Expense";
import Settlement from "@/models/Settlement";
import { calculateSplit } from "@/lib/calculateSplit";
import { generateSettlements } from "@/lib/generateSettlements";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  try {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ message: "Invalid groupId" }, { status: 400 });
    }

    const group = await Group.findById(groupId).lean();
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    const memberIds = (group.members || []).map((member: mongoose.Types.ObjectId) =>
      member.toString()
    );

    const isMember = memberIds.includes(session.user.id);
    if (!isMember) {
      return NextResponse.json(
        { message: "You are not a member of this group" },
        { status: 403 }
      );
    }

    const expenses = await Expense.find({ groupId }).lean();

    const balancesMap = calculateSplit(
      expenses.map((expense) => ({
        title: expense.title,
        amount: expense.amount,
        paidBy: expense.paidBy,
        splitAmong: expense.splitAmong,
      })),
      memberIds
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
              status: "pending",
            }))
          )
        : [];

    return NextResponse.json(
      {
        message: "Settlements generated",
        count: created.length,
        settlements: created,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate settlements";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
