import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/user.model";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const users = await User.find({})
      .select("name email image upiId reputationScore createdAt")
      .sort({ reputationScore: -1, name: 1 })
      .lean();

    return NextResponse.json({ users }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
