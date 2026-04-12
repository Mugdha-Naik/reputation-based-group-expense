import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`min-h-screen bg-[linear-gradient(180deg,rgba(9,12,18,0.98)_0%,rgba(13,19,32,0.98)_48%,rgba(18,24,38,0.98)_100%)] text-[var(--color-text)] px-4 py-4 sm:px-6 sm:py-6 ${className}`.trim()}>
      {children}
    </div>
  );
}
