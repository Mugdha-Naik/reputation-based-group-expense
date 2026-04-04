import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Group from "@/models/Group.model";
import Expense from "@/models/Expense";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const groups = await Group.find({
      members: session.user.id,
    })
      .populate("members", "name image")
      .sort({ createdAt: -1 })
      .lean();

    const groupIds = groups.map((group) => group._id);

    const expenses = await Expense.find({
      groupId: { $in: groupIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    const expensesByGroup = expenses.reduce<Record<string, typeof expenses>>((accumulator, expense) => {
      const key = String(expense.groupId);
      accumulator[key] = accumulator[key] || [];
      accumulator[key].push(expense);
      return accumulator;
    }, {});

    const enrichedGroups = groups.map((group) => {
      const groupExpenses = expensesByGroup[String(group._id)] || [];
      const latestExpense = groupExpenses[0];
      const totalExpense = groupExpenses.reduce(
        (sum, expense) => sum + (typeof expense.amount === "number" ? expense.amount : 0),
        0
      );

      return {
        ...group,
        totalExpense,
        expenseCount: groupExpenses.length,
        latestExpense: latestExpense
          ? {
              title: latestExpense.title,
              amount: latestExpense.amount,
              paidBy: latestExpense.paidBy,
              createdAt: latestExpense.createdAt,
            }
          : null,
      };
    });

    return NextResponse.json(enrichedGroups, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}
