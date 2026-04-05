import { ReactNode } from "react";

interface CenteredCardProps {
  children: ReactNode;
  outerClassName?: string;
  cardClassName?: string;
}

export default function CenteredCard({
  children,
  outerClassName = "",
  cardClassName = "",
}: CenteredCardProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4 text-[var(--color-text)] ${outerClassName}`.trim()}>
      <div className={`w-full max-w-md rounded-2xl border border-[var(--color-bg-secondary)] bg-[var(--color-card)] p-5 sm:p-6 ${cardClassName}`.trim()}>
        {children}
      </div>
    </div>
  );
}
