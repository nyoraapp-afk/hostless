import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * EmptyState — Pattern 6 (états vides explicites avec CTA approprié).
 * Pas d'emoji (règle du brand book), on utilise une icône Lucide.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
      role="status"
    >
      {icon && (
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-aubergine-50 text-aubergine-medium"
          aria-hidden
        >
          {icon}
        </div>
      )}
      <h3 className="font-serif text-lg font-medium text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
