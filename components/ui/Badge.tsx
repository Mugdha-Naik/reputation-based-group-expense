import { ReactNode } from "react";

type BadgeVariant = "cyan" | "violet" | "emerald" | "amber" | "slate";

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: BadgeVariant;
}

const badgeStyles: Record<BadgeVariant, string> = {
  cyan: "border-cyan-400/30 bg-cyan-400/14 text-cyan-100",
  violet: "border-violet-400/30 bg-violet-400/14 text-violet-100",
  emerald: "border-emerald-400/30 bg-emerald-400/14 text-emerald-100",
  amber: "border-amber-400/30 bg-amber-400/14 text-amber-100",
  slate: "border-white/12 bg-white/6 text-slate-100",
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
