"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aubergine focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
  {
    variants: {
      variant: {
        primary:
          "bg-aubergine text-on-aubergine hover:bg-aubergine-medium active:bg-aubergine-deep shadow-sm",
        secondary:
          "bg-surface text-ink border border-border hover:bg-cream-warm hover:border-aubergine-soft",
        ghost: "text-ink-soft hover:bg-cream-warm hover:text-ink",
        outline:
          "border-2 border-aubergine text-aubergine bg-transparent hover:bg-aubergine hover:text-on-aubergine",
        destructive:
          "bg-error text-on-aubergine hover:bg-[#8E4A5C] active:bg-[#7B3F4F] shadow-sm",
        link: "text-aubergine underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-sm",
        md: "h-11 px-5 text-base rounded-md",
        lg: "h-13 px-6 text-lg rounded-md",
        icon: "h-10 w-10 rounded-sm",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      block,
      asChild = false,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // asChild : on rend uniquement l'enfant (souvent un <Link> ou <a>) sans
    // ajouter notre propre wrapping (Slot exige un seul enfant React, pas de Fragment).
    // On laisse l'utilisateur composer leftIcon/rightIcon directement dans son enfant.
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(buttonVariants({ variant, size, block, className }))}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, block, className }))}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          leftIcon
        )}
        <span>{isLoading && loadingText ? loadingText : children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
