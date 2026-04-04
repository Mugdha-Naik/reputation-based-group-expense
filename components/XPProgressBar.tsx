import ProgressBar from "@/components/ui/ProgressBar";

interface XPProgressBarProps {
  currentXP: number;
  maxXP: number;
  level: string;
}

export default function XPProgressBar({
  currentXP,
  maxXP,
  level,
}: XPProgressBarProps) {
  return (
    <ProgressBar
      value={currentXP}
      max={maxXP}
      label={`Level: ${level}`}
      hint={`${currentXP}/${maxXP} XP`}
    />
  );
}
