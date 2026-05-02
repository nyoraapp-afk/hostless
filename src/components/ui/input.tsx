"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  hasError?: boolean;
  inputSize?: "sm" | "md" | "lg";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError, inputSize = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-4 text-base",
      lg: "h-13 px-5 text-lg",
    };
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex w-full rounded-sm border bg-surface text-ink",
          "transition-colors placeholder:text-ink-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aubergine focus-visible:ring-offset-0 focus-visible:border-aubergine",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          hasError
            ? "border-error border-2 bg-error/5"
            : "border-border hover:border-aubergine-soft",
          sizeClasses[inputSize],
          className
        )}
        aria-invalid={hasError || undefined}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
