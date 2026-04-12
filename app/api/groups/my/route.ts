"use client";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Group from "@/models/Group.model";
import Expense from "@/models/Expense";
import "@/models/user.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

type AggregatedExpense = {
  groupId: string;
  title: string;
  amount: number;
  paidBy: string;
  createdAt?: string | Date;
};

interface PopulatedGroupMember {
  _id: string;
  name?: string;
  image?: string;
}

interface GroupSummary {
  _id: string;
  createdAt?: string;
  members?: PopulatedGroupMember[];
  [key: string]: unknown;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const url = new URL(req.url);
    const groupLimit = parseInt(url.searchParams.get("groupLimit") || "10", 10);
    const expenseLimit = parseInt(url.searchParams.get("expenseLimit") || "10", 10);

    // ✅ FIXED QUERY (handles both string + ObjectId safely)
    const userId = session.user.id;

    const groupsRaw = await Group.find({})
      .populate("members", "name image")
      .sort({ createdAt: -1 })
      .limit(groupLimit)
      .lean();

    // ✅ remove duplicate members (fix React key issue)
    const groups = groupsRaw.map((group: any) => {
      const unique = new Map();
      for (const m of group.members || []) {
        unique.set(String(m._id), m);
      }
      return { ...group, members: Array.from(unique.values()) };
    }) as GroupSummary[];

    const groupIds = groups.map((g) => g._id);

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

    const expensesByGroup: Record<string, AggregatedExpense[]> = {};

<<<<<<< HEAD
    for (const g of expenses) {
      expensesByGroup[String(g._id)] = g.expenses || [];
=======
    for (const group of expenses as Array<{ _id: unknown; expenses: AggregatedExpense[] }>) {
      expensesByGroup[String(group._id)] = Array.isArray(group.expenses)
        ? group.expenses
        : [];
>>>>>>> 746265c1ba31b467ea768dbbec94b7906ae11d43
    }

    const enrichedGroups = groups.map((group) => {
      const groupExpenses = expensesByGroup[String(group._id)] || [];
      const latestExpense = groupExpenses[0];

      const totalExpense = groupExpenses.reduce(
<<<<<<< HEAD
        (sum, e) => sum + (typeof e.amount === "number" ? e.amount : 0),
=======
        (sum, expense) =>
          sum + (typeof expense.amount === "number" ? expense.amount : 0),
>>>>>>> 746265c1ba31b467ea768dbbec94b7906ae11d43
        0
      );

      const paidByName = latestExpense
        ? group.members?.find(
<<<<<<< HEAD
            (m) => String(m._id) === String(latestExpense.paidBy)
=======
            (member) =>
              String(member._id) === String(latestExpense.paidBy)
>>>>>>> 746265c1ba31b467ea768dbbec94b7906ae11d43
          )?.name
        : undefined;

      return {
        ...group,
        totalExpense,
        expenseCount: groupExpenses.length,
        latestExpense: latestExpense
          ? {
              title: latestExpense.title,
              amount: latestExpense.amount,
              paidBy: latestExpense.paidBy,
              paidByName,
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