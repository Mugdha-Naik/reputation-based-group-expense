import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Settlement from "@/models/Settlement";
import User from "@/models/user.model";
import { buildReputationSummary } from "@/lib/reputation";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [completedSettlements, pendingSettlements, completedAmountAgg, pendingAmountAgg] =
      await Promise.all([
      Settlement.countDocuments({
        fromUser: userId,
        status: "completed",
      }),
      Settlement.countDocuments({
        fromUser: userId,
        status: "pending",
      }),
      Settlement.aggregate([
        { $match: { fromUser: userObjectId, status: "completed" } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]),
      Settlement.aggregate([
        { $match: { fromUser: userObjectId, status: "pending" } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]),
    ]);

    const completedAmount = completedAmountAgg[0]?.totalAmount ?? 0;
    const pendingAmount = pendingAmountAgg[0]?.totalAmount ?? 0;

    const summary = buildReputationSummary({
      completedSettlements,
      pendingSettlements,
      completedAmount,
      pendingAmount,
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { reputationScore: summary.score },
      { new: true }
    )
      .select("reputationScore")
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Reputation fetched successfully",
        score: updatedUser.reputationScore,
        completedSettlements: summary.completedSettlements,
        pendingSettlements: summary.pendingSettlements,
        completedAmount: summary.completedAmount,
        pendingAmount: summary.pendingAmount,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch reputation";

    return NextResponse.json({ message }, { status: 500 });
  }
}
