import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_RECEIPT_IMAGE_LENGTH = 4_000_000;
const RECEIPT_MATCH_TOLERANCE = 2;

export interface ReceiptValidationResult {
  isReceipt: boolean;
  reason: string;
  detectedAmount: number | null;
  matchesClaimedAmount: boolean;
  merchant?: string;
}

function sanitizeEnvValue(value?: string | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function extractJsonObject(text: string) {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("Model did not return a JSON object.");
  }

  return JSON.parse(match[0]) as Record<string, unknown>;
}

function parseReceiptDataUrl(dataUrl: string) {
  const trimmed = dataUrl.trim();
  const match = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Receipt image must be a valid image upload.");
  }

  if (trimmed.length > MAX_RECEIPT_IMAGE_LENGTH) {
    throw new Error("Receipt image is too large. Please choose a smaller image.");
  }

  return {
    mimeType: match[1],
    base64Data: match[2],
  };
}

function normalizeAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeValidationResponse(
  raw: Record<string, unknown>,
  claimedAmount: number
): ReceiptValidationResult {
  const detectedAmount = normalizeAmount(raw.detectedAmount);
  const matchesClaimedAmount =
    typeof raw.matchesClaimedAmount === "boolean"
      ? raw.matchesClaimedAmount
      : detectedAmount !== null &&
        Math.abs(detectedAmount - claimedAmount) <= RECEIPT_MATCH_TOLERANCE;

  return {
    isReceipt: raw.isReceipt === true,
    reason:
      typeof raw.reason === "string" && raw.reason.trim()
        ? raw.reason.trim()
        : raw.isReceipt === true
          ? "Receipt verified successfully."
          : "Uploaded image does not appear to be a valid payment receipt.",
    detectedAmount,
    matchesClaimedAmount,
    merchant: typeof raw.merchant === "string" ? raw.merchant.trim() : undefined,
  };
}

export async function validateReceiptImage(
  dataUrl: string,
  claimedAmount: number
): Promise<ReceiptValidationResult> {
  const apiKey =
    sanitizeEnvValue(process.env.GEMINI_API_KEY) ||
    sanitizeEnvValue(process.env.GOOGLE_API_KEY);

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in .env.local");
  }

  const { mimeType, base64Data } = parseReceiptDataUrl(dataUrl);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: sanitizeEnvValue(process.env.GEMINI_MODEL) || "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `
You are validating whether an uploaded image is a genuine bill or payment receipt.

Claimed amount: ${claimedAmount}

Return ONLY valid JSON in this exact shape:
{
  "isReceipt": true,
  "reason": "",
  "detectedAmount": 0,
  "matchesClaimedAmount": true,
  "merchant": ""
}

Rules:
- isReceipt must be false if the image is irrelevant, not a receipt, too unclear, or missing payment/billing details
- detectedAmount should be the most likely total amount on the receipt, or null if unreadable
- matchesClaimedAmount should be true only if the detected total reasonably matches the claimed amount
- if the image is not a receipt, explain briefly in reason
- do not add markdown
- do not wrap in backticks
`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    },
  ]);

  const responseText = result.response.text().trim();
  const parsed = extractJsonObject(responseText);
  return normalizeValidationResponse(parsed, claimedAmount);
}
