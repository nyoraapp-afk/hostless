"use client";

import * as React from "react";
import { AlertTriangle, Info, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * ===========================================================================
 *   PATTERN 4 — Actions destructives sans confirmation contextualisée
 * ===========================================================================
 * Symptôme adressé :
 *   - Suppression villa cliente sans avertir des "12 alertes orphelines" (final_1 L. 2148)
 *   - Suppression prospect "won" sans rappel "converti en cliente le X" (final_1 L. 3795)
 *   - Modales génériques "Êtes-vous sûr ?" sans recap d'impact
 *   - Pas de différence entre annuler une notif (info) et supprimer un compte (destructive)
 *
 * Règles du composant :
 *   3 niveaux explicites :
 *     - `info`         : modale simple OK/Annuler
 *     - `warning`      : modale + recap d'impact (avant/après, date d'effet)
 *     - `destructive`  : modale + recap + champ texte "Tapez SUPPRIMER" pour confirmer
 *
 * Le bouton primaire utilise la couleur destructive et est jamais à gauche du Annuler.
 */

export type ConfirmLevel = "info" | "warning" | "destructive";

export type ImpactItem = {
  /** Label de l'impact (ex: "Forfait actuel"). */
  label: string;
  /** Valeur avant action (optionnel). */
  before?: string;
  /** Valeur après action. */
  after: string;
  /**
   * Type d'impact pour la couleur. Par défaut neutre.
   *   - `cost-up`   = surcoût (rouge atténué)
   *   - `cost-down` = économie (vert)
   *   - `loss`      = perte de données (rouge)
   *   - `info`      = neutre (gris)
   */
  variant?: "cost-up" | "cost-down" | "loss" | "info";
};

export type ConfirmActionProps = {
  /** Le déclencheur (ex: bouton "Supprimer la villa"). */
  trigger: React.ReactNode;
  /** Niveau de gravité — détermine la copy, la couleur et la friction. */
  level: ConfirmLevel;
  /** Titre court (ex: "Supprimer Villa Sunset ?"). */
  title: string;
  /** Description longue, contextualisée — JAMAIS "êtes-vous sûr ?". */
  description: string;
  /** Liste des impacts concrets (recap obligatoire pour warning + destructive). */
  impacts?: ImpactItem[];
  /**
   * Date d'effet de l'action.
   *   - undefined = effet immédiat
   *   - une date  = effet différé (sera affichée explicitement)
   */
  effectiveAt?: Date | string;
  /** Mot à taper pour confirmer (uniquement pour `destructive`). Default: "SUPPRIMER". */
  confirmWord?: string;
  /** Libellé du bouton principal. */
  confirmLabel?: string;
  /** Libellé du bouton d'annulation. */
  cancelLabel?: string;
  /** Action à exécuter si confirmation. Doit être async. */
  onConfirm: () => Promise<void> | void;
};

export function ConfirmAction({
  trigger,
  level,
  title,
  description,
  impacts,
  effectiveAt,
  confirmWord = "SUPPRIMER",
  confirmLabel,
  cancelLabel = "Annuler",
  onConfirm,
}: ConfirmActionProps) {
  const [open, setOpen] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const requireTypedConfirm = level === "destructive";
  const canConfirm = !requireTypedConfirm || typed.trim() === confirmWord;

  const defaultLabel: Record<ConfirmLevel, string> = {
    info: "Confirmer",
    warning: "Continuer",
    destructive: "Supprimer définitivement",
  };
  const buttonLabel = confirmLabel ?? defaultLabel[level];

  const buttonVariant: Record<ConfirmLevel, "primary" | "destructive"> = {
    info: "primary",
    warning: "primary",
    destructive: "destructive",
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setIsLoading(true);
    try {
      await onConfirm();
      setOpen(false);
      setTyped("");
    } finally {
      setIsLoading(false);
    }
  };

  const Icon = {
    info: Info,
    warning: AlertTriangle,
    destructive: Trash2,
  }[level];

  const iconColor = {
    info: "bg-aubergine-50 text-aubergine",
    warning: "bg-gold-soft/60 text-[#7A6432]",
    destructive: "bg-error/10 text-error",
  }[level];

  // Reset typed text whenever modal closes
  React.useEffect(() => {
    if (!open) {
      setTyped("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                iconColor
              )}
              aria-hidden
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 pt-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1.5">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          {/* Recap d'impact (obligatoire pour warning + destructive) */}
          {impacts && impacts.length > 0 && (
            <div className="rounded-md border border-border bg-cream-warm/40 p-4">
              <div className="text-eyebrow mb-3">Ce qui va changer</div>
              <ul className="space-y-2.5">
                {impacts.map((impact, idx) => (
                  <li
                    key={idx}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <span className="text-ink-soft">{impact.label}</span>
                    <span className="flex items-baseline gap-2 font-mono text-xs">
                      {impact.before !== undefined && (
                        <>
                          <span className="text-ink-muted line-through">
                            {impact.before}
                          </span>
                          <span className="text-ink-muted" aria-hidden>
                            →
                          </span>
                        </>
                      )}
                      <span
                        className={cn(
                          "font-medium",
                          impact.variant === "cost-up" && "text-error",
                          impact.variant === "cost-down" && "text-success",
                          impact.variant === "loss" && "text-error",
                          (!impact.variant || impact.variant === "info") &&
                            "text-ink"
                        )}
                      >
                        {impact.after}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Date d'effet explicite — Pattern 2 (vérité sur l'instant d'application) */}
          {effectiveAt !== undefined && (
            <p className="mt-4 flex items-start gap-2 text-xs text-ink-muted">
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden />
              <span>
                Cette action sera appliquée{" "}
                <strong className="font-medium text-ink-soft">
                  {effectiveAt instanceof Date || typeof effectiveAt === "string"
                    ? new Intl.DateTimeFormat("fr-FR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      }).format(
                        typeof effectiveAt === "string"
                          ? new Date(effectiveAt)
                          : effectiveAt
                      )
                    : "immédiatement"}
                </strong>
                .
              </span>
            </p>
          )}
          {effectiveAt === undefined && level === "destructive" && (
            <p className="mt-4 flex items-start gap-2 text-xs text-error">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden />
              <span>
                Cette action est <strong>immédiate et définitive</strong>.
              </span>
            </p>
          )}

          {/* Friction supplémentaire pour destructive : taper le mot magique */}
          {requireTypedConfirm && (
            <div className="mt-5 flex flex-col gap-2">
              <Label htmlFor="confirm-action-word" className="text-ink">
                Pour confirmer, tapez{" "}
                <code className="rounded bg-cream-warm px-1.5 py-0.5 font-mono text-xs text-aubergine">
                  {confirmWord}
                </code>{" "}
                ci-dessous.
              </Label>
              <Input
                id="confirm-action-word"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={confirmWord}
                hasError={typed.length > 0 && !canConfirm}
              />
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={buttonVariant[level]}
            onClick={handleConfirm}
            disabled={!canConfirm}
            isLoading={isLoading}
            loadingText="Application..."
          >
            {buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
