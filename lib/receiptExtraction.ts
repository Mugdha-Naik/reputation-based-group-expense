export const RECEIPT_CATEGORIES = [
  "food",
  "travel",
  "rent",
  "supplies",
  "entertainment",
  "utilities",
  "other",
] as const;

export type ReceiptCategory = (typeof RECEIPT_CATEGORIES)[number];

export interface ReceiptExtractionConfidence {
  title?: number;
  amount?: number;
  category?: number;
  date?: number;
}

export interface ReceiptExtractionResult {
  title: string;
  amount: number | null;
  category: ReceiptCategory | null;
  date: string | null;
  participantHints: string[];
  confidence?: ReceiptExtractionConfidence;
}

export const EMPTY_RECEIPT_EXTRACTION: ReceiptExtractionResult = {
  title: "",
  amount: null,
  category: null,
  date: null,
  participantHints: [],
};

const isReceiptCategory = (value: unknown): value is ReceiptCategory =>
  typeof value === "string" &&
  RECEIPT_CATEGORIES.includes(value as ReceiptCategory);

const normalizeConfidenceValue = (value: unknown) =>
  typeof value === "number" && value >= 0 && value <= 1 ? value : undefined;

export function normalizeReceiptExtraction(raw: unknown): ReceiptExtractionResult {
  const candidate = raw && typeof raw === "object" ? raw : {};
  const record = candidate as Record<string, unknown>;

  const title = typeof record.title === "string" ? record.title.trim() : "";
  const amount =
    typeof record.amount === "number" && Number.isFinite(record.amount) && record.amount > 0
      ? record.amount
      : null;
  const category = isReceiptCategory(record.category) ? record.category : null;
  const date =
    typeof record.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(record.date)
      ? record.date
      : null;
  const participantHints = Array.isArray(record.participantHints)
    ? record.participantHints.filter((value): value is string => typeof value === "string")
    : [];

  const confidenceSource =
    record.confidence && typeof record.confidence === "object"
      ? (record.confidence as Record<string, unknown>)
      : null;

  const confidence = confidenceSource
    ? {
        title: normalizeConfidenceValue(confidenceSource.title),
        amount: normalizeConfidenceValue(confidenceSource.amount),
        category: normalizeConfidenceValue(confidenceSource.category),
        date: normalizeConfidenceValue(confidenceSource.date),
      }
    : undefined;

  return {
    title,
    amount,
    category,
    date,
    participantHints,
    confidence,
  };
}

export const receiptExtractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    amount: { type: ["number", "null"] },
    category: {
      type: ["string", "null"],
      enum: [...RECEIPT_CATEGORIES, null],
    },
    date: { type: ["string", "null"] },
    participantHints: {
      type: "array",
      items: { type: "string" },
    },
    confidence: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "number" },
        amount: { type: "number" },
        category: { type: "number" },
        date: { type: "number" },
      },
      required: [],
    },
  },
  required: ["title", "amount", "category", "date", "participantHints"],
} as const;
