import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-cyan-300/20 bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 text-white shadow-[0_14px_34px_rgba(37,99,235,0.24)] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_18px_44px_rgba(99,102,241,0.3)]",
  secondary:
    "border border-[var(--color-border)] bg-[var(--color-card-strong)] text-[var(--color-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-[var(--color-border-strong)] hover:bg-[rgba(21,30,46,0.98)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:bg-white/5 hover:text-[var(--color-text)]",
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
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b111b]",
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
