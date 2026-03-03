import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Group from "@/models/Group.model";
import User from "@/models/user.model";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  await connectDB();

  const { groupId } = await context.params;

  try {
    const group = await Group.findById(groupId).populate("members");

    if (!group) {
      return NextResponse.json(
        { message: "Group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { members: group.members, groupName: group.name },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch members" },
      { status: 500 }
    );
  }
}