import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Updated to use named import
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Settlement from "@/models/Settlement";
import { buildReputationSummary } from "@/lib/reputation";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const users = await User.find({})
      .select("name email image upiId reputationScore createdAt")
      .lean();

    const settlementMetrics = await Settlement.aggregate([
      {
        $group: {
          _id: {
            fromUser: "$fromUser",
            status: "$status",
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const metricsByUser = new Map<
      string,
      {
        completedSettlements: number;
        pendingSettlements: number;
        completedAmount: number;
        pendingAmount: number;
      }
    >();

    settlementMetrics.forEach((entry: {
      _id: { fromUser: unknown; status: "completed" | "pending" };
      count: number;
      totalAmount: number;
    }) => {
      const userId = String(entry._id.fromUser);
      const current = metricsByUser.get(userId) ?? {
        completedSettlements: 0,
        pendingSettlements: 0,
        completedAmount: 0,
        pendingAmount: 0,
      };

      if (entry._id.status === "completed") {
        current.completedSettlements = entry.count;
        current.completedAmount = entry.totalAmount;
      } else {
        current.pendingSettlements = entry.count;
        current.pendingAmount = entry.totalAmount;
      }

      metricsByUser.set(userId, current);
    });

    const scoredUsers = users
      .map((user) => {
        const metrics = metricsByUser.get(String(user._id)) ?? {
          completedSettlements: 0,
          pendingSettlements: 0,
          completedAmount: 0,
          pendingAmount: 0,
        };
        const summary = buildReputationSummary(metrics);

        return {
          ...user,
          storedReputationScore: user.reputationScore,
          reputationScore: summary.score,
        };
      })
      .sort((first, second) => {
        const scoreDelta = (second.reputationScore ?? 0) - (first.reputationScore ?? 0);
        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        return String(first.name).localeCompare(String(second.name));
      });

    const updates = scoredUsers.filter(
      (user) => user.reputationScore !== user.storedReputationScore
    );

    if (updates.length > 0) {
      await User.bulkWrite(
        updates.map((user) => ({
          updateOne: {
            filter: { _id: user._id },
            update: { reputationScore: user.reputationScore },
          },
        }))
      );
    }

    return NextResponse.json(
      {
        users: scoredUsers.map(({ storedReputationScore, ...user }) => user),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
