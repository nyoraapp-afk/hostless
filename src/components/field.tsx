"use client";

import * as React from "react";
import { AlertCircle, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Field = wrapper autour d'un input avec label, hint, message d'erreur.
 * Adresse Pattern 9 (accessibilité) et Pattern 10 (copywriting d'erreur précis).
 *
 * Règle : un message d'erreur affiche toujours
 *   1. une icône (jamais couleur seule — Pattern 9)
 *   2. un texte spécifique au type d'erreur (Pattern 10)
 */
export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy =
    [hintId, errorId].filter(Boolean).join(" ") || undefined;

  // Inject aria-describedby into the child input
  const enhancedChild = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{
        id?: string;
        "aria-describedby"?: string;
        "aria-required"?: boolean;
      }>, {
        id: htmlFor,
        "aria-describedby": describedBy,
        "aria-required": required,
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {enhancedChild}
      {hint && !error && (
        <p
          id={hintId}
          className="flex items-start gap-1.5 text-xs text-ink-muted"
        >
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden />
          <span>{hint}</span>
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-xs text-error font-medium"
          role="alert"
        >
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
