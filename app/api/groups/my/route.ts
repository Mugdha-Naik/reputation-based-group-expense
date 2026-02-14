import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import connectDB from "@/lib/db";
import Group from "@/models/Group.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const groups = await Group.find({
      members: session.user.id,
    }).sort({ createdAt: -1 });

    return NextResponse.json(groups, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}
