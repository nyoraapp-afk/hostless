"use client";

import * as React from "react";
import { Check, Clock, AlertCircle, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { formatDate, formatRelativeTime, cn } from "@/lib/utils";
import type { ResourceState } from "@/lib/types";

/**
 * ===========================================================================
 *   PATTERN 2 — Décalage entre action utilisateur et état affiché
 * ===========================================================================
 * Symptôme adressé :
 *   - Le proto disait "passage à Sérénité immédiat" en FAQ
 *     mais la modale disait "au prochain renouvellement" (v34 L. 1703 vs 1884)
 *   - Le webhook Stripe retardé laissait l'UI désynchronisée sans signaler
 *
 * Règles du composant :
 *   - `actual`     → état confirmé, badge discret vert (ou rien)
 *   - `pending`    → action en cours côté serveur (loader spinner, "Synchronisation...")
 *   - `scheduled`  → effet différé connu, badge orange + date d'effet (ex: "À partir du 01/05")
 *   - `failed`     → action a échoué, badge rouge + raison + CTA "Réessayer"
 *
 * Tous les composants qui affichent une valeur potentiellement désynchronisée
 * (forfait courant, équipe configurée, numéro WhatsApp en cours de validation, etc.)
 * doivent afficher un StateBadge à côté.
 */

type StateBadgeProps = {
  state: ResourceState;
  /** Date d'effet (pour `scheduled`). Ex: prochaine facturation Stripe. */
  effectiveAt?: Date | string;
  /** Message personnalisé pour `failed` (ex: "Carte refusée"). */
  errorMessage?: string;
  /** Description tooltip pour expliquer l'état. */
  tooltip?: string;
  /** Variante compacte (juste icône + label court) */
  compact?: boolean;
  className?: string;
};

const STATE_CONFIG: Record<
  ResourceState,
  {
    icon: typeof Check;
    label: string;
    classes: string;
    iconClasses: string;
    defaultTooltip: string;
  }
> = {
  actual: {
    icon: Check,
    label: "Actif",
    classes: "bg-success/10 text-success border-success/20",
    iconClasses: "text-success",
    defaultTooltip: "Cet état est synchronisé et confirmé.",
  },
  pending: {
    icon: Loader2,
    label: "Synchronisation",
    classes: "bg-aubergine-50 text-aubergine border-aubergine-100",
    iconClasses: "text-aubergine animate-spin",
    defaultTooltip: "Action en cours côté serveur, patientez.",
  },
  scheduled: {
    icon: Clock,
    label: "Programmé",
    classes: "bg-gold-soft/60 text-[#7A6432] border-gold/30",
    iconClasses: "text-[#9A7B36]",
    defaultTooltip: "Cette modification s'appliquera à la date indiquée.",
  },
  failed: {
    icon: AlertCircle,
    label: "Échec",
    classes: "bg-error/10 text-error border-error/20",
    iconClasses: "text-error",
    defaultTooltip: "L'action n'a pas pu être appliquée, réessayez.",
  },
};

export function StateBadge({
  state,
  effectiveAt,
  errorMessage,
  tooltip,
  compact = false,
  className,
}: StateBadgeProps) {
  const config = STATE_CONFIG[state];
  const Icon = config.icon;

  let label: string = config.label;
  if (state === "scheduled" && effectiveAt) {
    label = compact
      ? `Le ${formatDate(effectiveAt)}`
      : `À partir du ${formatDate(effectiveAt)}`;
  } else if (state === "failed" && errorMessage) {
    label = errorMessage;
  }

  const tooltipText =
    tooltip ??
    (state === "scheduled" && effectiveAt
      ? `Effet ${formatRelativeTime(effectiveAt)}`
      : config.defaultTooltip);

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-medium",
        config.classes,
        className
      )}
      role="status"
      aria-label={`État : ${label}. ${tooltipText}`}
    >
      <Icon
        className={cn("h-3 w-3 flex-shrink-0", config.iconClasses)}
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </span>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
