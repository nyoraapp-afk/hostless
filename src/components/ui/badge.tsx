import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-aubergine-50 text-aubergine border border-aubergine-100",
        success: "bg-success/10 text-success border border-success/20",
        warning: "bg-gold-soft text-[#7A6432] border border-gold/30",
        error: "bg-error/10 text-error border border-error/20",
        info: "bg-aubergine-50 text-aubergine border border-aubergine-100",
        neutral: "bg-cream-warm text-ink-soft border border-border",
        premium:
          "bg-gradient-to-r from-gold-soft to-powder-light text-[#6E5728] border border-gold/40",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
