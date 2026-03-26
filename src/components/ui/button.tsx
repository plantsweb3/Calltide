"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg min-h-[44px]",
  md: "px-4 py-2 text-sm gap-2 rounded-lg min-h-[44px]",
  lg: "px-5 py-2.5 text-sm gap-2 rounded-xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", style, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none db-btn";

    return (
      <button
        ref={ref}
        data-variant={variant}
        className={`${base} ${sizeClasses[size]} ${className}`}
        style={style}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
