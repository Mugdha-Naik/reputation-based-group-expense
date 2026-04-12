import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import Expense from "@/models/Expense";
import Group from "@/models/Group.model";
import Notification from "@/models/Notification";
import { authOptions } from "@/lib/auth";
import User from "@/models/user.model";
import { rebuildPendingSettlementsForGroup } from "@/lib/rebuildSettlements";
import cloudinary from "@/lib/cloudinary";

// =======================
// POST /api/expenses
// =======================
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      groupId,
      title,
      category,
      amount,
      paidBy,
      splitAmong,
      participants,
      paymentMethod,
      billImage,
      billImages,
    } = body ?? {};

    // ✅ Validate groupId FIRST
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ message: "Invalid groupId" }, { status: 400 });
    }

    await connectDB();

    // ✅ Check group
    const group = await Group.findById(groupId);

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    const isMember = group.members.some(
      (member: mongoose.Types.ObjectId) =>
        member.toString() === session.user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { message: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // ✅ Resolve participants
    const resolvedParticipants = Array.isArray(participants)
      ? participants
      : splitAmong;

    if (!resolvedParticipants || resolvedParticipants.length === 0) {
      return NextResponse.json(
        { message: "Participants are required" },
        { status: 400 }
      );
    }

    // ✅ Resolve values
    const resolvedPaidBy =
      typeof paidBy === "string" && paidBy.trim()
        ? paidBy.trim()
        : session.user.id;

    const resolvedAmount =
      typeof amount === "number" && amount > 0 ? amount : 1;

    const resolvedTitle =
      typeof title === "string" && title.trim()
        ? title.trim()
        : "Group Expense";

    const resolvedCategory =
      typeof category === "string" && category.trim()
        ? category.trim()
        : undefined;

    // =======================
    // 🔥 Upload to Cloudinary
    // =======================
    const uploadedReceipts: Array<{ url: string; publicId?: string }> = [];

    const normalizedBillImages: string[] = Array.isArray(billImages)
      ? billImages.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
      : typeof billImage === "string" && billImage.trim().length > 0
        ? [billImage]
        : [];

    if (normalizedBillImages.length > 0) {
      try {
        for (const image of normalizedBillImages) {
          const uploadResponse = await cloudinary.uploader.upload(image, {
            folder: "expense_proofs",
            transformation: [{ width: 800, quality: "auto", fetch_format: "auto" }],
          });

          uploadedReceipts.push({
            url: uploadResponse.secure_url,
            publicId: uploadResponse.public_id,
          });
        }
      } catch (error: unknown) {
        console.error("Cloudinary error:", error);

        const errorRecord = error as { http_code?: number } | null;

        if (errorRecord?.http_code === 401) {
          const keySuffix =
            typeof process.env.CLOUDINARY_API_KEY === "string"
              ? process.env.CLOUDINARY_API_KEY.trim().slice(-4)
              : "";
          const cloudName =
            typeof process.env.CLOUDINARY_CLOUD_NAME === "string"
              ? process.env.CLOUDINARY_CLOUD_NAME.trim()
              : "";

          return NextResponse.json(
            {
              message:
                "Cloudinary authentication failed. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
              hint: cloudName
                ? `Server is currently using CLOUDINARY_CLOUD_NAME='${cloudName}' and API key ending '${keySuffix}'. Restart the dev server after editing env vars.`
                : "Restart the dev server after editing env vars.",
            },
            { status: 500 }
          );
        }

        return NextResponse.json({ message: "Image upload failed" }, { status: 500 });
      }
    }

    // =======================
    // ✅ Create expense
    // =======================
    const expenseData: {
      groupId: string;
      title: string;
      category?: string;
      amount: number;
      paidBy: string;
      splitAmong: string[];
      participants: string[];
      paymentMethod?: "UPI" | "Cash";
      billImage?: string;
      receipts?: Array<{
        url: string;
        publicId?: string;
        uploadedBy: string;
        uploadedAt: Date;
      }>;
    } = {
      groupId,
      title: resolvedTitle,
      category: resolvedCategory,
      amount: resolvedAmount,
      paidBy: resolvedPaidBy,
      splitAmong: resolvedParticipants,
      participants: resolvedParticipants,
      paymentMethod,
    };

    if (uploadedReceipts.length > 0) {
      expenseData.billImage = uploadedReceipts[0].url;
      expenseData.receipts = uploadedReceipts.map((receipt) => ({
        url: receipt.url,
        publicId: receipt.publicId,
        uploadedBy: String(session.user.id),
        uploadedAt: new Date(),
      }));
    }

    const expense = await Expense.create(expenseData);

    // =======================
    // ⭐ Reputation update
    // =======================
    if (uploadedReceipts.length > 0) {
      await User.findByIdAndUpdate(resolvedPaidBy, {
        $inc: { reputationScore: 3 },
      });
    }

    // =======================
    // 🔁 Rebuild settlements
    // =======================
    await rebuildPendingSettlementsForGroup(groupId);

    // =======================
    // 🔔 Notifications
    // =======================
    const payer = await User.findById(resolvedPaidBy).select("name").lean();
    const payerName = payer?.name || "A member";

    const notifyUserIds = resolvedParticipants.filter(
      (id: string) => id !== resolvedPaidBy
    );

    if (notifyUserIds.length > 0) {
      await Notification.insertMany(
        notifyUserIds.map((userId: string) => ({
          userId,
          groupId,
          expenseId: expense._id,
          message: `${payerName} added a new expense.`,
          link: `/trip/${groupId}`,
          read: false,
        }))
      );
    }

    return NextResponse.json({ expense }, { status: 201 });

  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      { message: "Failed to create expense" },
      { status: 500 }
    );
  }
}

// =======================
// GET /api/expenses
// =======================
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const groupId = request.nextUrl.searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { message: "groupId query param is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ message: "Invalid groupId" }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(groupId).lean();

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    const isMember = (group.members || []).some(
      (member: mongoose.Types.ObjectId) =>
        member.toString() === session.user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { message: "You are not a member of this group" },
        { status: 403 }
      );
    }

    const expenses = await Expense.find({ groupId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ expenses }, { status: 200 });

  } catch (error) {
    console.error("Fetch expenses error:", error);
    return NextResponse.json(
      { message: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}
