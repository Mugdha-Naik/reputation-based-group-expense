import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={[
        "rounded-[28px] border border-[var(--color-bg-secondary)] bg-[var(--color-card)] p-5",
        "transition duration-300 hover:scale-[1.02] hover:border-[var(--color-accent-teal)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
