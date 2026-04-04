import { ReactNode } from "react";

type BadgeVariant = "cyan" | "violet" | "emerald" | "amber" | "slate";

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: BadgeVariant;
}

const badgeStyles: Record<BadgeVariant, string> = {
  cyan: "border-cyan-400/25 bg-cyan-400/12 text-cyan-200",
  violet: "border-violet-400/25 bg-violet-400/12 text-violet-200",
  emerald: "border-emerald-400/25 bg-emerald-400/12 text-emerald-200",
  amber: "border-amber-400/25 bg-amber-400/12 text-amber-200",
  slate: "border-white/10 bg-white/8 text-slate-200",
};

export default function Badge({
  children,
  className = "",
  variant = "slate",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
        badgeStyles[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
