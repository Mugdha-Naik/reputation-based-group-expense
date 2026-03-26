"use client";

import { useEffect, useState } from "react";

interface ReputationBadgeProps {
  initialScore?: number;
  compact?: boolean;
}

interface ReputationResponse {
  score: number;
  completedSettlements: number;
  pendingSettlements: number;
}

function getBadgeTone(score: number) {
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

function getLabel(score: number) {
  if (score >= 95) return "Excellent";
  if (score >= 80) return "Reliable";
  if (score >= 60) return "Watchlist";
  return "At Risk";
}

export default function ReputationBadge({
  initialScore = 100,
  compact = false,
}: ReputationBadgeProps) {
  const [score, setScore] = useState(initialScore);
  const [summary, setSummary] = useState<ReputationResponse | null>(null);

  useEffect(() => {
    let ignore = false;

    const fetchReputation = async () => {
      try {
        const res = await fetch("/api/reputation", { credentials: "include" });
        if (!res.ok) return;

        const data: ReputationResponse = await res.json();
        if (ignore) return;

        setScore(data.score);
        setSummary(data);
      } catch {
        // Keep the badge resilient if reputation is temporarily unavailable.
      }
    };

    fetchReputation();

    return () => {
      ignore = true;
    };
  }, []);

  const tone = getBadgeTone(score);
  const label = getLabel(score);

  if (compact) {
    return (
      <div className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
        Reputation {score}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <p className="text-[11px] uppercase tracking-[0.18em] opacity-80">Reputation</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold text-white">{score}</p>
          <p className="mt-1 text-sm">{label}</p>
        </div>
        {summary && (
          <div className="text-right text-xs opacity-85">
            <p>{summary.completedSettlements} completed</p>
            <p>{summary.pendingSettlements} pending</p>
          </div>
        )}
      </div>
    </div>
  );
}
