import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Group from "@/models/Group.model";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await req.json();

  if (!groupId || typeof groupId !== "string") {
    return NextResponse.json({ message: "groupId is required" }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    return NextResponse.json({ message: "Invalid groupId" }, { status: 400 });
  }

  await connectDB();

  const group = await Group.findById(groupId);
  if (!group) {
    return NextResponse.json({ message: "Group not found" }, { status: 404 });
  }

  const isAlreadyMember = group.members.some(
    (member: mongoose.Types.ObjectId) => member.toString() === session.user.id
  );

  if (!isAlreadyMember) {
    group.members.push(new mongoose.Types.ObjectId(session.user.id));
    await group.save();
  }

  return NextResponse.json({
    message: isAlreadyMember ? "Already a member of this group" : "Joined group",
  });
}
