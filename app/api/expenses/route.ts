import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Expense from "@/models/Expense";

// POST /api/expenses
// Body: { groupId, title, amount, paidBy, splitAmong }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, title, amount, paidBy, splitAmong } = body ?? {};

    if (!groupId || !title || amount === undefined || !paidBy || !splitAmong) {
      return NextResponse.json(
        {
          message:
            "groupId, title, amount, paidBy and splitAmong are required",
        },
        { status: 400 }
      );
    }

    if (typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { message: "title must be a non-empty string" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { message: "amount must be a number greater than 0" },
        { status: 400 }
      );
    }

    if (typeof paidBy !== "string" || paidBy.trim().length === 0) {
      return NextResponse.json(
        { message: "paidBy must be a non-empty member id" },
        { status: 400 }
      );
    }

    if (!Array.isArray(splitAmong) || splitAmong.length === 0) {
      return NextResponse.json(
        { message: "splitAmong must be a non-empty array of member ids" },
        { status: 400 }
      );
    }

    await connectDB();

    const expense = await Expense.create({
      groupId,
      title: title.trim(),
      amount,
      paidBy: paidBy.trim(),
      splitAmong,
    });

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
    const groupId = request.nextUrl.searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { message: "groupId query param is required" },
        { status: 400 }
      );
    }

    await connectDB();

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
