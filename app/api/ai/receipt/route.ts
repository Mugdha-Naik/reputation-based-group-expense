import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

type ReceiptExtraction = {
  merchant: string;
  total: number;
  date: string;
  category: string;
  items: string[];
};

function sanitizeEnvValue(value?: string | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeModelName(modelName: string) {
  const normalized = modelName.trim().toLowerCase();

  if (!normalized) {
    return "gemini-2.5-flash";
  }

  if (normalized === "flash") {
    return "gemini-2.5-flash";
  }

  if (normalized === "flash-lite" || normalized === "lite") {
    return "gemini-2.5-flash-lite";
  }

  return normalized;
}

function getModelCandidates(preferredModel: string) {
  return Array.from(
    new Set([
      normalizeModelName(preferredModel),
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-2.0-flash-001",
      "gemini-2.0-flash-lite",
      "gemini-2.0-flash-lite-001",
    ])
  );
}

function createMockReceiptData(fileName: string): ReceiptExtraction {
  const normalizedName = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();

  return {
    merchant: normalizedName || "Demo Receipt",
    total: 250,
    date: new Date().toISOString().slice(0, 10),
    // Avoid forcing a misleading category when AI extraction is unavailable.
    category: "",
    items: ["Sample item 1", "Sample item 2"],
  };
}

function normalizeReceiptData(data: Partial<ReceiptExtraction>): ReceiptExtraction {
  return {
    merchant: typeof data.merchant === "string" ? data.merchant : "",
    total:
      typeof data.total === "number"
        ? data.total
        : Number.parseFloat(String(data.total ?? 0)) || 0,
    date: typeof data.date === "string" ? data.date : "",
    category: typeof data.category === "string" ? data.category : "",
    items: Array.isArray(data.items)
      ? data.items.map((item) => String(item))
      : [],
  };
}

function extractJsonObject(text: string) {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("Model did not return a JSON object.");
  }

  return JSON.parse(match[0]) as Partial<ReceiptExtraction>;
}

function isQuotaError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    error.message.includes("429 Too Many Requests") ||
    message.includes("quota exceeded") ||
    message.includes("resource_exhausted") ||
    message.includes("rate limit")
  );
}

function isAuthError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("api key not valid") ||
    message.includes("permission denied") ||
    message.includes("unauthenticated") ||
    message.includes("invalid argument")
  );
}

function getRetryDelaySeconds(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  const retryInfoMatch = error.message.match(/retry in\s+(\d+(?:\.\d+)?)s/i);
  if (retryInfoMatch) {
    return Math.ceil(Number.parseFloat(retryInfoMatch[1]));
  }

  const retryDelayMatch = error.message.match(/"retryDelay":"(\d+)s"/i);
  if (retryDelayMatch) {
    return Number.parseInt(retryDelayMatch[1], 10);
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const apiKey =
      sanitizeEnvValue(process.env.GEMINI_API_KEY) ||
      sanitizeEnvValue(process.env.GOOGLE_API_KEY);
    const preferredModel = sanitizeEnvValue(process.env.GEMINI_MODEL) || "gemini-2.5-flash";
    const allowMockFallback = process.env.RECEIPT_AI_ALLOW_MOCK_FALLBACK !== "false";
    const modelCandidates = getModelCandidates(preferredModel);

    if (!apiKey) {
      return NextResponse.json(
        { message: "GEMINI_API_KEY is missing in .env.local" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const receipt = formData.get("receipt");

    if (!(receipt instanceof File)) {
      return NextResponse.json(
        { message: "Please upload a receipt file using the 'receipt' field." },
        { status: 400 }
      );
    }

    if (!receipt.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Only image receipts are supported for now." },
        { status: 400 }
      );
    }

    const bytes = await receipt.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString("base64");

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = `
You are a receipt parser.

Read this receipt image and extract:
- merchant
- total
- date
- category
- items

Return ONLY valid JSON.
Use exactly this shape:

{
  "merchant": "",
  "total": 0,
  "date": "",
  "category": "",
  "items": []
}

Rules:
- total must be a number
- items must be an array of strings
- if a field is unclear, keep it empty or 0
- do not add markdown
- do not wrap in backticks
`;

    let extracted: ReceiptExtraction | null = null;
    let lastError: unknown = null;
    let quotaError: unknown = null;
    let authError: unknown = null;

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
          },
        });

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: receipt.type,
            },
          },
        ]);

        const text = result.response.text().trim();
        const parsed = extractJsonObject(text);
        extracted = normalizeReceiptData(parsed);
        break;
      } catch (modelError) {
        lastError = modelError;
        console.error(`Receipt processing failed with model ${modelName}:`, modelError);

        if (isQuotaError(modelError)) {
          quotaError = modelError;
          break;
        }

        if (isAuthError(modelError)) {
          authError = modelError;
          break;
        }
      }
    }

    if (authError) {
      return NextResponse.json(
        {
          message: "Gemini API authentication failed. Check GEMINI_API_KEY and GEMINI_MODEL.",
          error: authError instanceof Error ? authError.message : "Authentication failed",
        },
        { status: 401 }
      );
    }

    if (quotaError) {
      const retryAfter = getRetryDelaySeconds(quotaError);

      if (allowMockFallback) {
        return NextResponse.json(
          {
            message: "Gemini quota exceeded, returning mock receipt data for local testing.",
            extracted: createMockReceiptData(receipt.name),
            usedMockFallback: true,
            retryAfterSeconds: retryAfter,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          message: "Gemini quota exceeded. Please retry after some time or enable billing.",
          error: quotaError instanceof Error ? quotaError.message : "Quota exceeded",
          retryAfterSeconds: retryAfter,
        },
        { status: 429 }
      );
    }

    if (!extracted) {
      throw lastError instanceof Error
        ? lastError
        : new Error("No Gemini model returned a valid receipt response.");
    }

    return NextResponse.json(
      {
        message: "Receipt processed successfully",
        extracted,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Receipt processing error:", error);

    return NextResponse.json(
      {
        message: "AI failed to process receipt.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
