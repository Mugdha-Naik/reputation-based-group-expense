import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={[
        "rounded-[28px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-[var(--shadow-surface)] backdrop-blur-xl",
        "transition duration-300 hover:scale-[1.01] hover:border-[var(--color-border-strong)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
