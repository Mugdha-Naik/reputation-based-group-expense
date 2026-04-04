import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import Expense from "@/models/Expense";
import Group from "@/models/Group.model";
import Notification from "@/models/Notification";
import { authOptions } from "@/lib/auth";
import User from "@/models/user.model";
import { rebuildPendingSettlementsForGroup } from "@/lib/rebuildSettlements";

// POST /api/expenses
// Body:
// { groupId, paidBy, participants, paymentMethod, billImage }
// Legacy body still supported: { groupId, title, amount, paidBy, splitAmong }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      groupId,
      title,
      category,
      amount,
      paidBy,
      splitAmong,
      participants,
      paymentMethod,
      billImage,
    } = body ?? {};

    const resolvedParticipants = Array.isArray(participants)
      ? participants
      : splitAmong;
    const resolvedPaidBy =
      typeof paidBy === "string" && paidBy.trim().length > 0
        ? paidBy.trim()
        : session.user.id;
    const resolvedAmount =
      typeof amount === "number" && !Number.isNaN(amount) && amount > 0
        ? amount
        : 1;
    const resolvedTitle =
      typeof title === "string" && title.trim().length > 0
        ? title.trim()
        : "Group Expense";
    const resolvedCategory =
      typeof category === "string" && category.trim().length > 0
        ? category.trim()
        : undefined;

    if (!groupId || !resolvedPaidBy || !resolvedParticipants) {
      return NextResponse.json(
        {
          message:
            "groupId, paidBy, and participants (or splitAmong) are required",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json(
        { message: "Invalid groupId" },
        { status: 400 }
      );
    }

    if (
      typeof resolvedAmount !== "number" ||
      Number.isNaN(resolvedAmount) ||
      resolvedAmount <= 0
    ) {
      return NextResponse.json(
        { message: "amount must be a number greater than 0" },
        { status: 400 }
      );
    }

    if (session.user.id !== resolvedPaidBy) {
      return NextResponse.json(
        { message: "You cannot create an expense for another payer" },
        { status: 403 }
      );
    }

    if (!Array.isArray(resolvedParticipants) || resolvedParticipants.length === 0) {
      return NextResponse.json(
        { message: "participants must be a non-empty array of member ids" },
        { status: 400 }
      );
    }

    if (paymentMethod && !["UPI", "Cash"].includes(paymentMethod)) {
      return NextResponse.json(
        { message: "paymentMethod must be UPI or Cash" },
        { status: 400 }
      );
    }

    await connectDB();

    const group = await Group.findById(groupId).lean();
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    const groupMemberIds = (group.members || []).map((member: mongoose.Types.ObjectId) =>
      member.toString()
    );

    if (!groupMemberIds.includes(resolvedPaidBy)) {
      return NextResponse.json(
        { message: "Payer must be a member of this group" },
        { status: 403 }
      );
    }

    const hasInvalidParticipant = resolvedParticipants.some(
      (participant: unknown) =>
        typeof participant !== "string" || !groupMemberIds.includes(participant)
    );

    if (hasInvalidParticipant) {
      return NextResponse.json(
        { message: "All participants must be members of this group" },
        { status: 403 }
      );
    }

    const expense = await Expense.create({
      groupId,
      title: resolvedTitle,
      category: resolvedCategory,
      amount: resolvedAmount,
      paidBy: resolvedPaidBy,
      splitAmong: resolvedParticipants,
      participants: resolvedParticipants,
      paymentMethod,
      billImage,
    });

    const payer = await User.findById(resolvedPaidBy).select("name").lean();
    const payerName = payer?.name || "A member";
    const notifyUserIds = Array.from(new Set(resolvedParticipants)).filter(
      (participant) => participant !== resolvedPaidBy
    );

    await rebuildPendingSettlementsForGroup(groupId);

    if (notifyUserIds.length > 0) {
      await Notification.insertMany(
        notifyUserIds.map((userId) => ({
          userId,
          groupId,
          expenseId: expense._id,
          message: `${payerName} added a new group expense. Open the trip to view updated balances.`,
          link: `/trip/${groupId}`,
          read: false,
        }))
      );
    }

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      { message: "Failed to create expense" },
      { status: 500 }
    );
  }
}

// GET /api/expenses?groupId=<group-id>
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const groupId = request.nextUrl.searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { message: "groupId query param is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ message: "Invalid groupId" }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(groupId).lean();
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    const isMember = (group.members || []).some(
      (member: mongoose.Types.ObjectId) => member.toString() === session.user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { message: "You are not a member of this group" },
        { status: 403 }
      );
    }

    const expenses = await Expense.find({ groupId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error) {
    console.error("Fetch expenses error:", error);
    return NextResponse.json(
      { message: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}
