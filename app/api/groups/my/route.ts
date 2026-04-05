import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Group from "@/models/Group.model";
import Expense from "@/models/Expense";
import "@/models/user.model";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Pagination params (defaults)
    const url = new URL(req.url);
    const groupLimit = parseInt(url.searchParams.get("groupLimit") || "10", 10);
    const expenseLimit = parseInt(url.searchParams.get("expenseLimit") || "10", 10);

    const groups = await Group.find({
      members: session.user.id,
    })
      .populate("members", "name image")
      .sort({ createdAt: -1 })
      .limit(groupLimit)
      .lean();

    const groupIds = groups.map((group) => group._id);

    // Only fetch latest N expenses per group
    const expenses = await Expense.aggregate([
      { $match: { groupId: { $in: groupIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$groupId",
          expenses: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          expenses: { $slice: ["$expenses", expenseLimit] },
        },
      },
    ]);

    const expensesByGroup: Record<string, any[]> = {};
    for (const group of expenses) {
      expensesByGroup[String(group._id)] = group.expenses;
    }

    const enrichedGroups = groups.map((group) => {
      const groupExpenses = expensesByGroup[String(group._id)] || [];
      const latestExpense = groupExpenses[0];
      const memberNameById = new Map(
        ((group.members || []) as Array<{ _id: unknown; name?: string }>).map((member) => [
          String(member._id),
          member.name || "Member",
        ])
      );
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
              paidBy:
                memberNameById.get(String(latestExpense.paidBy)) ||
                latestExpense.paidBy ||
                "Member",
              createdAt: latestExpense.createdAt,
            }
          : null,
      };
    });

    return NextResponse.json(enrichedGroups, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Failed to fetch groups"
            : "Failed to fetch groups",
      },
      { status: 500 }
    );
  }
}
