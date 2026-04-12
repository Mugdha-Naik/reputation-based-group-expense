import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const notifications = await Notification.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ notifications }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { notificationId, markAllRead } = await request.json();

    await connectDB();

    if (markAllRead === true) {
      await Notification.updateMany(
        { userId: session.user.id, read: false },
        { $set: { read: true } }
      );

      return NextResponse.json({ message: "Notifications marked as read" }, { status: 200 });
    }

    if (!notificationId || typeof notificationId !== "string") {
      return NextResponse.json(
        { message: "notificationId is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json({ message: "Invalid notificationId" }, { status: 400 });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: session.user.id },
      { $set: { read: true } },
      { new: true }
    ).lean();

    if (!notification) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ notification }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
