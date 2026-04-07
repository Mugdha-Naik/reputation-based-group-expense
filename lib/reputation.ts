const DEFAULT_BASE_SCORE = 100;
const DEFAULT_COMPLETED_REWARD = 2;
const DEFAULT_PENDING_PENALTY = 4;
const DEFAULT_COMPLETED_AMOUNT_DIVISOR = 400;
const DEFAULT_PENDING_AMOUNT_DIVISOR = 200;
const MAX_COMPLETED_BONUS = 12;
const MAX_PENDING_IMPACT = 60;
const MIN_REPUTATION_SCORE = 0;
const MAX_REPUTATION_SCORE = 100;

interface ReputationInput {
  completedSettlements: number;
  pendingSettlements: number;
  completedAmount?: number;
  pendingAmount?: number;
  receiptReputationDelta?: number;
  baseScore?: number;
  completedReward?: number;
  pendingPenalty?: number;
  completedAmountDivisor?: number;
  pendingAmountDivisor?: number;
}

interface ReputationSummary {
  score: number;
  completedSettlements: number;
  pendingSettlements: number;
  completedAmount: number;
  pendingAmount: number;
  receiptReputationDelta: number;
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

export function getReputationLabel(score: number): string {
  if (score >= 95) return "Excellent";
  if (score >= 80) return "Reliable";
  if (score >= 60) return "Watchlist";
  return "At Risk";
}

export function clampReputation(score: number): number {
  return Math.min(MAX_REPUTATION_SCORE, Math.max(MIN_REPUTATION_SCORE, score));
}

export function calculateReputation({
  completedSettlements,
  pendingSettlements,
  completedAmount = 0,
  pendingAmount = 0,
  receiptReputationDelta = 0,
  baseScore = DEFAULT_BASE_SCORE,
  completedReward = DEFAULT_COMPLETED_REWARD,
  pendingPenalty = DEFAULT_PENDING_PENALTY,
  completedAmountDivisor = DEFAULT_COMPLETED_AMOUNT_DIVISOR,
  pendingAmountDivisor = DEFAULT_PENDING_AMOUNT_DIVISOR,
}: ReputationInput): number {
  if (
    completedSettlements < 0 ||
    pendingSettlements < 0 ||
    completedAmount < 0 ||
    pendingAmount < 0
  ) {
    throw new Error("Settlement metrics cannot be negative");
  }

  const completedImpact = Math.min(
    MAX_COMPLETED_BONUS,
    completedSettlements * completedReward + completedAmount / completedAmountDivisor
  );
  const pendingImpact = Math.min(
    MAX_PENDING_IMPACT,
    pendingSettlements * pendingPenalty + pendingAmount / pendingAmountDivisor
  );
  const rawScore =
    baseScore + completedImpact - pendingImpact + receiptReputationDelta;

  return clampReputation(Math.round(rawScore));
}

export function buildReputationSummary(input: ReputationInput): ReputationSummary {
  return {
    score: calculateReputation(input),
    completedSettlements: input.completedSettlements,
    pendingSettlements: input.pendingSettlements,
    completedAmount: input.completedAmount ?? 0,
    pendingAmount: input.pendingAmount ?? 0,
    receiptReputationDelta: input.receiptReputationDelta ?? 0,
  };
}

export type { ReputationInput, ReputationSummary };
