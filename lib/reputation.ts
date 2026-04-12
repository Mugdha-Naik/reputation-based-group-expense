// =======================
// 🎯 CONSTANTS
// =======================
const DEFAULT_BASE_SCORE = 100;
const MIN_REPUTATION_SCORE = 0;
const MAX_REPUTATION_SCORE = 100;

// settlement weights
const DEFAULT_COMPLETED_REWARD = 2;
const DEFAULT_PENDING_PENALTY = 4;
const DEFAULT_COMPLETED_AMOUNT_DIVISOR = 400;
const DEFAULT_PENDING_AMOUNT_DIVISOR = 200;

const MAX_COMPLETED_BONUS = 12;
const MAX_PENDING_IMPACT = 60;

// receipt weights
const VALID_RECEIPT_REWARD = 3;
const SUSPICIOUS_RECEIPT_PENALTY = 2;
const FAKE_RECEIPT_PENALTY = 6;

// payment behavior
const ON_TIME_PAYMENT_REWARD = 2;
const SMALL_DELAY_PENALTY = 1;
const LARGE_DELAY_PENALTY = 5;

// =======================
// 📦 TYPES
// =======================
interface ReputationInput {
  completedSettlements: number;
  pendingSettlements: number;
  completedAmount?: number;
  pendingAmount?: number;

  // NEW SYSTEM
  validReceipts?: number;
  suspiciousReceipts?: number;
  fakeReceipts?: number;

  // OLD SYSTEM (backward compatibility)
  receiptReputationDelta?: number;

  onTimePayments?: number;
  delayedPayments?: number;
  heavilyDelayedPayments?: number;
}

interface ReputationSummary {
  score: number;

  // breakdown
  settlementScore: number;
  receiptScore: number;
  paymentScore: number;

  completedSettlements: number;
  pendingSettlements: number;
  completedAmount: number;
  pendingAmount: number;
}

// =======================
// 🧠 CORE FUNCTIONS
// =======================
export function clampReputation(score: number): number {
  return Math.min(MAX_REPUTATION_SCORE, Math.max(MIN_REPUTATION_SCORE, score));
}

export function calculateReputation(input: ReputationInput): number {
  return buildReputationSummary(input).score;
}

// =======================
// 🔥 MAIN ENGINE
// =======================
export function buildReputationSummary({
  completedSettlements,
  pendingSettlements,
  completedAmount = 0,
  pendingAmount = 0,

  validReceipts = 0,
  suspiciousReceipts = 0,
  fakeReceipts = 0,

  receiptReputationDelta = 0, // ✅ FIXED

  onTimePayments = 0,
  delayedPayments = 0,
  heavilyDelayedPayments = 0,
}: ReputationInput): ReputationSummary {

  if (
    completedSettlements < 0 ||
    pendingSettlements < 0 ||
    completedAmount < 0 ||
    pendingAmount < 0
  ) {
    throw new Error("Settlement metrics cannot be negative");
  }

  // =======================
  // 🔹 Settlement Score
  // =======================
  const completedImpact = Math.min(
    MAX_COMPLETED_BONUS,
    completedSettlements * DEFAULT_COMPLETED_REWARD +
      completedAmount / DEFAULT_COMPLETED_AMOUNT_DIVISOR
  );

  const pendingImpact = Math.min(
    MAX_PENDING_IMPACT,
    pendingSettlements * DEFAULT_PENDING_PENALTY +
      pendingAmount / DEFAULT_PENDING_AMOUNT_DIVISOR
  );

  const settlementScore = completedImpact - pendingImpact;

  // =======================
  // 🔹 Receipt Score
  // =======================
  const receiptScore =
    (validReceipts * VALID_RECEIPT_REWARD -
      suspiciousReceipts * SUSPICIOUS_RECEIPT_PENALTY -
      fakeReceipts * FAKE_RECEIPT_PENALTY) +
    receiptReputationDelta;

  // =======================
  // 🔹 Payment Score
  // =======================
  const paymentScore =
    onTimePayments * ON_TIME_PAYMENT_REWARD -
    delayedPayments * SMALL_DELAY_PENALTY -
    heavilyDelayedPayments * LARGE_DELAY_PENALTY;

  // =======================
  // 🔹 Final Score
  // =======================
  const rawScore =
    DEFAULT_BASE_SCORE +
    settlementScore +
    receiptScore +
    paymentScore;

  const finalScore = clampReputation(Math.round(rawScore));

  return {
    score: finalScore,

    settlementScore,
    receiptScore,
    paymentScore,

    completedSettlements,
    pendingSettlements,
    completedAmount,
    pendingAmount,
  };
}

// =======================
// 🎨 UI HELPERS
// =======================
export function getReputationLabel(score: number): string {
  if (score >= 95) return "Excellent";
  if (score >= 80) return "Reliable";
  if (score >= 60) return "Watchlist";
  return "At Risk";
}

export function getReputationTone(score: number): string {
  if (score >= 95) {
    return "border-green-500/30 bg-green-500/10 text-green-300";
  }

  if (score >= 80) {
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }

  if (score >= 60) {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  }

  return "border-red-500/30 bg-red-500/10 text-red-300";
}

// =======================
// 📤 EXPORT TYPES
// =======================
export type { ReputationInput, ReputationSummary };