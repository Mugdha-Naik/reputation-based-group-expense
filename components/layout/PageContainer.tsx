import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`min-h-screen bg-black text-white px-4 py-4 sm:px-6 sm:py-6 ${className}`.trim()}>
      {children}
    </div>
  );
}
