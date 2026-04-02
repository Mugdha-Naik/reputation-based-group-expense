const DEFAULT_BASE_SCORE = 100;
const DEFAULT_COMPLETED_REWARD = 2;
const DEFAULT_PENDING_PENALTY = 3;
const MIN_REPUTATION_SCORE = 0;
const MAX_REPUTATION_SCORE = 100;

interface ReputationInput {
  completedSettlements: number;
  pendingSettlements: number;
  baseScore?: number;
  completedReward?: number;
  pendingPenalty?: number;
}

interface ReputationSummary {
  score: number;
  completedSettlements: number;
  pendingSettlements: number;
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
  baseScore = DEFAULT_BASE_SCORE,
  completedReward = DEFAULT_COMPLETED_REWARD,
  pendingPenalty = DEFAULT_PENDING_PENALTY,
}: ReputationInput): number {
  if (completedSettlements < 0 || pendingSettlements < 0) {
    throw new Error("Settlement counts cannot be negative");
  }

  const rawScore =
    baseScore +
    completedSettlements * completedReward -
    pendingSettlements * pendingPenalty;

  return clampReputation(rawScore);
}

export function buildReputationSummary(input: ReputationInput): ReputationSummary {
  return {
    score: calculateReputation(input),
    completedSettlements: input.completedSettlements,
    pendingSettlements: input.pendingSettlements,
  };
}

export type { ReputationInput, ReputationSummary };
