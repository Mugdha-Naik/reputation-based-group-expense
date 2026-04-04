interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  hint?: string;
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  hint,
  className = "",
}: ProgressBarProps) {
  const safeMax = max <= 0 ? 100 : max;
  const percent = Math.max(0, Math.min(100, (value / safeMax) * 100));

  return (
    <div className={className}>
      {(label || hint) && (
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-white">{label}</span>
          <span className="text-slate-300">{hint}</span>
        </div>
      )}
      <div className="h-3 overflow-hidden rounded-full bg-slate-900/80 ring-1 ring-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
