import { cn } from "@/lib/utils";

/**
 * Stepper visible en haut des pages d'onboarding (p4 → p7).
 * Adresse Pattern 7 (hiérarchie visuelle) — l'utilisateur sait où il en est.
 */
export function OnboardingStepper({
  current,
  total = 6,
  label,
}: {
  current: number; // 1-indexed
  total?: number;
  label: string;
}) {
  return (
    <div className="mx-auto w-full max-w-xl px-6 pt-6 sm:pt-8">
      <div className="text-eyebrow mb-2">
        Étape {current} sur {total}
      </div>
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-pill transition-colors",
              i + 1 < current
                ? "bg-aubergine"
                : i + 1 === current
                ? "bg-aubergine"
                : "bg-border"
            )}
          />
        ))}
      </div>
      <p className="sr-only">{label}</p>
    </div>
  );
}
