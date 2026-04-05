import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-accent-teal)] text-white hover:bg-[var(--color-accent-navy)]",
  secondary:
    "border border-[var(--color-bg-secondary)] bg-[var(--color-card)] text-[var(--color-text)] hover:border-[var(--color-accent-teal)] hover:bg-[var(--color-bg-secondary)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]",
};

export default function Button({
  children,
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-300",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
