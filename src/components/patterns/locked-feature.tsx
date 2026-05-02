"use client";

import * as React from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_LABELS, PLAN_PRICES, type PlanSlug } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * ===========================================================================
 *   PATTERN 1 — Feature lock visuellement non ambigu
 * ===========================================================================
 * Symptôme adressé :
 *   Dans les prototypes, l'onglet Équipe en plan Essentiel avait juste
 *   `opacity: 0.45` et restait cliquable, sans cadenas, sans badge plan,
 *   sans message d'upsell clair (v34 ligne 3290).
 *
 * Règles du composant :
 *   1. Si `isLocked=true`, on N'AFFICHE PAS l'enfant — on affiche un upsell.
 *   2. Cadenas + badge "Sérénité" obligatoires en haut.
 *   3. Désaturation forte du contenu masqué (pas juste opacity).
 *   4. CTA primaire avec prix réel du plan requis.
 *   5. Au clic sur la zone, on ouvre `onUpsellClick` (pas la feature).
 *
 * Garde côté serveur (à brancher en Phase 1) : middleware `requirePlan('SERENITE')`
 * qui rejette les actions hors plan, pour ne pas dépendre uniquement de l'UI.
 */
export function LockedFeature({
  isLocked,
  requiredPlan,
  reason,
  onUpsellClick,
  preview,
  children,
  className,
}: {
  /** Si false, on rend simplement les enfants (feature accessible). */
  isLocked: boolean;
  /** Plan requis pour débloquer (ex: "SERENITE"). */
  requiredPlan: PlanSlug;
  /** Raison spécifique (ex: "Le dispatch par catégorie nécessite Sérénité"). */
  reason: string;
  /** Callback au clic sur le CTA d'upsell. Recommandé : ouvrir une modale d'upgrade. */
  onUpsellClick: () => void;
  /**
   * Aperçu visuel (typiquement un screenshot/mockup désaturé) montrant
   * à quoi ressemble la feature. Optionnel mais recommandé pour donner envie.
   */
  preview?: React.ReactNode;
  /** Le contenu de la feature, rendu uniquement si `isLocked=false`. */
  children?: React.ReactNode;
  className?: string;
}) {
  if (!isLocked) {
    return <>{children}</>;
  }

  const planLabel = PLAN_LABELS[requiredPlan];
  const price = PLAN_PRICES[requiredPlan];

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-md border border-aubergine/20 bg-gradient-to-br from-aubergine-50 to-cream",
        className
      )}
      aria-labelledby="locked-feature-title"
    >
      {/* Badge plan en haut à droite */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <Badge variant="premium" size="md" className="shadow-sm">
          <Sparkles className="h-3 w-3" aria-hidden />
          {planLabel}
        </Badge>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-12 text-center sm:px-12 sm:py-16">
        <div
          className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-aubergine text-on-aubergine shadow-md"
          aria-hidden
        >
          <Lock className="h-6 w-6" />
        </div>

        <h2
          id="locked-feature-title"
          className="font-serif text-2xl font-medium text-aubergine sm:text-3xl"
        >
          Réservé à <em className="text-aubergine-medium">{planLabel}</em>
        </h2>

        <p className="mt-3 max-w-md text-sm text-ink-soft sm:text-base">
          {reason}
        </p>

        {/* Aperçu désaturé optionnel */}
        {preview && (
          <div
            className="mt-8 w-full max-w-2xl rounded-md border border-border bg-surface p-4 saturate-50 opacity-70 pointer-events-none select-none"
            aria-hidden
          >
            {preview}
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={onUpsellClick}
            leftIcon={<Sparkles className="h-4 w-4" aria-hidden />}
          >
            Passer à {planLabel} — {formatPrice(price)}/mois
          </Button>
          <p className="text-xs text-ink-muted">
            Annulable à tout moment, sans engagement.
          </p>
        </div>
      </div>
    </section>
  );
}
