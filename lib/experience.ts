const levelConfig = [
  { label: "Beginner", min: 0, max: 39, accent: "amber" as const },
  { label: "Trusted", min: 40, max: 64, accent: "cyan" as const },
  { label: "Pro", min: 65, max: 84, accent: "violet" as const },
  { label: "Elite", min: 85, max: 100, accent: "emerald" as const },
];

export function getExperienceLevel(score: number) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const level =
    levelConfig.find((entry) => safeScore >= entry.min && safeScore <= entry.max) ||
    levelConfig[0];

  const span = Math.max(1, level.max - level.min + 1);
  const progressWithinLevel = ((safeScore - level.min) / span) * 100;
  const nextLevel = levelConfig.find((entry) => entry.min > level.max) || null;

  return {
    score: safeScore,
    label: level.label,
    accent: level.accent,
    progressWithinLevel: Math.max(6, Math.min(100, progressWithinLevel)),
    rangeLabel: `${level.min}-${level.max} XP`,
    nextLevelLabel: nextLevel?.label || "Max Level",
    pointsToNext: nextLevel ? Math.max(0, nextLevel.min - safeScore) : 0,
  };
}

export function getProfileBadges(score: number) {
  const level = getExperienceLevel(score);
  const badges = ["Active User"];

  if (score >= 70) {
    badges.push("Fast Payer");
  }

  if (score >= 85 || level.label === "Elite") {
    badges.push("Contributor");
  } else {
    badges.push("Trusted Circle");
  }

  return badges.slice(0, 3);
}
