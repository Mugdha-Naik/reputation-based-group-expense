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

  const userObjectId = new mongoose.Types.ObjectId(session.user.id);

  // 🔥 ATOMIC OPERATION (prevents duplicates)
  const result = await Group.findOneAndUpdate(
    { _id: groupId },
    { $addToSet: { members: userObjectId } }, // ensures uniqueness
    { new: true }
  );

  if (!result) {
    return NextResponse.json({ message: "Group not found" }, { status: 404 });
  }

  // Optional: detect if user was already present
  const alreadyMember =
    result.members.filter((m: mongoose.Types.ObjectId) => m.toString() === session.user.id).length > 1;

  return NextResponse.json({
    message: alreadyMember ? "Already a member of this group" : "Joined group",
  });
}