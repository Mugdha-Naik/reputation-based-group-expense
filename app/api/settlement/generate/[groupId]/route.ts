import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import connectDB from "@/lib/db";
import Group from "@/models/Group.model";
import { rebuildPendingSettlementsForGroup } from "@/lib/rebuildSettlements";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  await connectDB();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;

  try {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ message: "Invalid groupId" }, { status: 400 });
    }

    const group = await Group.findById(groupId).lean();
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    const memberIds = (group.members || []).map((member: mongoose.Types.ObjectId) =>
      member.toString()
    );

    const isMember = memberIds.includes(session.user.id);
    if (!isMember) {
      return NextResponse.json(
        { message: "You are not a member of this group" },
        { status: 403 }
      );
    }

    const created = await rebuildPendingSettlementsForGroup(groupId);

    return NextResponse.json(
      {
        message: "Settlements generated",
        count: created.length,
        settlements: created,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate settlements";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
