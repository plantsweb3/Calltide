"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
  md: "px-4 py-2 text-sm gap-2 rounded-lg",
  lg: "px-5 py-2.5 text-sm gap-2 rounded-xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", style, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none";

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: { background: "var(--db-accent)", color: "#fff" },
      secondary: { background: "var(--db-hover)", border: "1px solid var(--db-border)", color: "var(--db-text)" },
      ghost: { color: "var(--db-text-muted)" },
      danger: { background: "var(--db-danger-bg)", color: "var(--db-danger)" },
    };

    const hoverStyles: Record<string, Partial<React.CSSProperties>> = {
      primary: { background: "var(--db-accent-hover)" },
      secondary: { background: "var(--db-border)" },
      ghost: { background: "var(--db-hover)", color: "var(--db-text)" },
      danger: { background: "var(--db-danger)", color: "#fff" },
    };

    return (
      <button
        ref={ref}
        className={`${base} ${sizeClasses[size]} ${className}`}
        style={{ ...variantStyles[variant], ...style }}
        disabled={disabled}
        onMouseEnter={(e) => {
          if (disabled) return;
          const hs = hoverStyles[variant];
          if (hs) {
            Object.entries(hs).forEach(([k, v]) => {
              (e.currentTarget.style as unknown as Record<string, string>)[k] = v as string;
            });
          }
          props.onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          if (disabled) return;
          const vs = variantStyles[variant];
          // Reset to base styles
          e.currentTarget.style.background = (vs.background as string) || "transparent";
          if (vs.color) e.currentTarget.style.color = vs.color as string;
          props.onMouseLeave?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
