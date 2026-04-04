// app/api/settlement/[groupId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Settlement from "@/models/Settlement";
import Group from "@/models/Group.model";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
   const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { groupId } = await params;

  try {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json(
        { message: "Invalid groupId" },
        { status: 400 }
      );
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

    const settlements = await Settlement.find({ groupId })
      .populate("fromUser", "name upiId")
      .populate("toUser", "name upiId")
      .sort({ createdAt: -1 });

    return NextResponse.json(settlements, { status: 200 });

  } catch {
    return NextResponse.json(
      { message: "Failed to fetch settlements" },
      { status: 500 }
    );
  }
}
