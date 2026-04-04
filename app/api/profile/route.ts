import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Settlement from "@/models/Settlement";

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

    return NextResponse.json({ user, pendingSummary }, { status: 200 });
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
    const image = typeof body?.image === "string" ? body.image.trim() : "";

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
        image: image || undefined,
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
