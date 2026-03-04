// app/api/settlement/[groupId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Settlement from "@/models/Settlement";
import authOptions from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  await connectDB();

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

    const settlements = await Settlement.find({ groupId })
      .populate("fromUser", "name")
      .populate("toUser", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json(settlements, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch settlements" },
      { status: 500 }
    );
  }
}