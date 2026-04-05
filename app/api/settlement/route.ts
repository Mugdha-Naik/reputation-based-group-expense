import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Settlement from "@/models/Settlement";
import User from "@/models/user.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildReputationSummary } from "@/lib/reputation";
import { rebuildPendingSettlementsForGroup } from "@/lib/rebuildSettlements";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Direct settlement creation is disabled. Add expenses and rebuild settlements from the expense ledger instead.",
    },
    {
      status: 405,
    }
  );
}

export async function PATCH(req: NextRequest) {
  await connectDB();

  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { settlementId } = await req.json();

    if (!settlementId) {
      return NextResponse.json(
        {
          message: "Settlement ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(settlementId)) {
      return NextResponse.json(
        {
          message: "Invalid settlement ID",
        },
        {
          status: 400,
        }
      );
    }
    const settlement = await Settlement.findById(settlementId);

    if (!settlement) {
      return NextResponse.json(
        {
          message: "Settlement not found",
        },
        {
          status: 404,
        }
      );
    }

    if (settlement.fromUser.toString() !== session.user.id) {
      return NextResponse.json(
        { message: "Not allowed" },
        { status: 403 }
      );
    }

    if (settlement.status === "completed") {
      return NextResponse.json(
        {
          message: "Settlement already completed",
        },
        {
          status: 400,
        }
      );
    }

    settlement.status = "completed";
    settlement.completedAt = new Date();

    await settlement.save();
    await rebuildPendingSettlementsForGroup(settlement.groupId.toString());

    const debtorUserId = settlement.fromUser.toString();
    const [completedSettlements, pendingSettlements, completedAmountAgg, pendingAmountAgg] =
      await Promise.all([
      Settlement.countDocuments({
        fromUser: debtorUserId,
        status: "completed",
      }),
      Settlement.countDocuments({
        fromUser: debtorUserId,
        status: "pending",
      }),
      Settlement.aggregate([
        { $match: { fromUser: new mongoose.Types.ObjectId(debtorUserId), status: "completed" } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]),
      Settlement.aggregate([
        { $match: { fromUser: new mongoose.Types.ObjectId(debtorUserId), status: "pending" } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]),
    ]);

    const completedAmount = completedAmountAgg[0]?.totalAmount ?? 0;
    const pendingAmount = pendingAmountAgg[0]?.totalAmount ?? 0;

    const reputationSummary = buildReputationSummary({
      completedSettlements,
      pendingSettlements,
      completedAmount,
      pendingAmount,
    });

    await User.findByIdAndUpdate(debtorUserId, {
      reputationScore: reputationSummary.score,
    });

    return NextResponse.json(
      {
        settlement,
        reputation: reputationSummary,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to update settlement",
      },
      {
        status: 500,
      }
    );
  }
}
