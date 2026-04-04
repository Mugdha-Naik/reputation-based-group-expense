import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={[
        "rounded-[28px] border border-white/12 bg-white/8 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.45)]",
        "backdrop-blur-xl transition duration-300 hover:scale-[1.02] hover:border-cyan-400/30",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
