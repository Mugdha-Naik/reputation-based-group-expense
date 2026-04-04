import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import Group from "@/models/Group.model";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ message: "Invalid groupId" }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(groupId).populate("members");

    if (!group) {
      return NextResponse.json(
        { message: "Group not found" },
        { status: 404 }
      );
    }

    const isMember = group.members.some(
      (member: { _id?: mongoose.Types.ObjectId } | mongoose.Types.ObjectId) =>
        (typeof member === "object" && member !== null && "_id" in member
          ? member._id?.toString()
          : member?.toString()) === session.user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { message: "You are not a member of this group" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { members: group.members, groupName: group.name },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
