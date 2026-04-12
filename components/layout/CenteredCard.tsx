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
      <div className={`w-full max-w-md rounded-[30px] border border-[var(--color-border)] bg-[var(--color-card-strong)] p-5 shadow-[var(--shadow-surface)] backdrop-blur-xl sm:p-6 ${cardClassName}`.trim()}>
        {children}
      </div>
    </div>
  );
}
