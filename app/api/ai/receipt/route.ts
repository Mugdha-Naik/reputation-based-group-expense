import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth";
import connectDB from "@/lib/db";
import Group from "@/models/Group.model";
import {
  normalizeReceiptExtraction,
  receiptExtractionJsonSchema,
} from "@/lib/receiptExtraction";

const RECEIPT_MODEL = process.env.OPENAI_RECEIPT_MODEL || "gpt-4.1-mini";

const receiptSystemPrompt = `
You extract receipt details from a single bill image for an expense-splitting app.
Return strict JSON only.
Rules:
- Extract the merchant or short receipt heading into "title".
- Extract the final total paid into "amount". Prefer the grand total, not subtotal or tax.
- Extract the receipt date into "date" in YYYY-MM-DD when visible, otherwise null.
- Classify the expense into exactly one category from: food, travel, rent, supplies, entertainment, utilities, other.
- "participantHints" may be an empty array. Do not invent people names.
- If uncertain, use empty string for title or null values instead of guessing aggressively.
- "confidence" values should be between 0 and 1.
`.trim();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { billImage, groupId } = await request.json();

    if (!groupId || typeof groupId !== "string") {
      return NextResponse.json({ message: "groupId is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ message: "Invalid groupId" }, { status: 400 });
    }

    if (!billImage || typeof billImage !== "string") {
      return NextResponse.json({ message: "billImage is required" }, { status: 400 });
    }

    await connectDB();

    const group = await Group.findById(groupId).lean();
    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    const isMember = (group.members || []).some(
      (member: mongoose.Types.ObjectId) => member.toString() === session.user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { message: "You are not a member of this group" },
        { status: 403 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          message:
            "Receipt extraction is not configured yet. Add OPENAI_API_KEY to your env file to enable it.",
        },
        { status: 503 }
      );
    }

    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: RECEIPT_MODEL,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: receiptSystemPrompt }],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Extract receipt details for expense autofill.",
              },
              {
                type: "input_image",
                image_url: billImage,
                detail: "high",
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "receipt_extraction",
            schema: receiptExtractionJsonSchema,
            strict: true,
          },
        },
      }),
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      return NextResponse.json(
        {
          message: "Receipt extraction failed",
          details: errorText.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const responseJson = await openAiResponse.json();
    const outputText =
      typeof responseJson.output_text === "string" ? responseJson.output_text : "";

    if (!outputText) {
      return NextResponse.json(
        { message: "Receipt extraction returned an empty response" },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(outputText);
    return NextResponse.json(normalizeReceiptExtraction(parsed), { status: 200 });
  } catch (error) {
    console.error("Receipt extraction error:", error);
    return NextResponse.json(
      { message: "Failed to extract receipt details" },
      { status: 500 }
    );
  }
}
