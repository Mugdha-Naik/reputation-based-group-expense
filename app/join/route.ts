import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import connectDB from "@/lib/db";
import Group from "@/models/Group.model";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await req.json();

  await connectDB();

  await Group.findByIdAndUpdate(groupId, {
    $addToSet: { members: session.user.id },
  });

  return NextResponse.json({ message: "Joined group" });
}
