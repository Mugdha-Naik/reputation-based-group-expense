import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Settlement from "@/models/Settlement";
import { buildReputationSummary } from "@/lib/reputation";

const MAX_PROFILE_IMAGE_LENGTH = 350_000;

function sanitizeProfileImage(image: unknown): string | undefined {
  if (typeof image !== "string") {
    return undefined;
  }

  const trimmed = image.trim();
  if (!trimmed) {
    return undefined;
  }

  const isRemoteUrl = /^https?:\/\//i.test(trimmed);
  const isDataImage = /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(trimmed);

  if (!isRemoteUrl && !isDataImage) {
    throw new Error("Profile image must be a valid URL or image upload.");
  }

  if (trimmed.length > MAX_PROFILE_IMAGE_LENGTH) {
    throw new Error("Profile image is too large. Please choose a smaller image.");
  }

  return trimmed;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .select("name email image upiId reputationScore createdAt")
      .lean();

    const pendingSettlements = await Settlement.find({
      fromUser: session.user.id,
      status: "pending",
    })
      .populate("toUser", "name")
      .select("amount toUser createdAt")
      .sort({ createdAt: -1 })
      .lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);
    const completedSettlementsAgg = await Settlement.aggregate([
      { $match: { fromUser: userObjectId, status: "completed" } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const reputationSummary = buildReputationSummary({
      completedSettlements: completedSettlementsAgg[0]?.count ?? 0,
      pendingSettlements: pendingSettlements.length,
      completedAmount: completedSettlementsAgg[0]?.totalAmount ?? 0,
      pendingAmount: pendingSettlements.reduce(
        (total, settlement) => total + settlement.amount,
        0
      ),
    });

    const normalizedUser =
      user.reputationScore === reputationSummary.score
        ? user
        : await User.findByIdAndUpdate(
            session.user.id,
            { reputationScore: reputationSummary.score },
            { new: true }
          )
            .select("name email image upiId reputationScore createdAt")
            .lean();

    const pendingSummary = {
      count: pendingSettlements.length,
      totalAmount: pendingSettlements.reduce(
        (total, settlement) => total + settlement.amount,
        0
      ),
      items: pendingSettlements.map((settlement) => ({
        amount: settlement.amount,
        createdAt: settlement.createdAt,
        toUserName:
          typeof settlement.toUser === "object" &&
          settlement.toUser !== null &&
          "name" in settlement.toUser
            ? String(settlement.toUser.name)
            : "Member",
      })),
    };

    return NextResponse.json({ user: normalizedUser, pendingSummary }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const upiId =
      typeof body?.upiId === "string" ? body.upiId.trim().toLowerCase() : "";
    const image = sanitizeProfileImage(body?.image);

    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ message: "Enter a valid email" }, { status: 400 });
    }

    await connectDB();

    const existingUser = await User.findOne({
      email,
      _id: { $ne: session.user.id },
    })
      .select("_id")
      .lean();

    if (existingUser) {
      return NextResponse.json(
        { message: "Email is already in use" },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        name,
        email,
        upiId: upiId || undefined,
        image,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("name email image upiId reputationScore createdAt")
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Profile updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
