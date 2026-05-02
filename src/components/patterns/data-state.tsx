"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

/**
 * ===========================================================================
 *   PATTERN 6 — Loading / pending / error / success states
 * ===========================================================================
 * Symptôme adressé :
 *   - Aucune page des protos n'avait de skeleton ou loader
 *   - "Dernière sync : il y a 2 min" hardcodé (final_1 L. 3376)
 *   - Pas d'indication d'erreur réseau, juste des toasts génériques
 *
 * Règles du composant :
 *   - `loading` : skeleton custom (pas de spinner) — on montre la forme du contenu à venir
 *   - `error`   : message contextualisé + bouton "Réessayer" + raison (réseau, server, perm)
 *   - `empty`   : EmptyState avec CTA approprié (jamais "Aucune donnée." sec)
 *   - `success` : on rend les enfants
 *
 * À utiliser systématiquement autour des zones data-driven (listes, stats, KPIs).
 */

export type DataStateStatus = "loading" | "error" | "empty" | "success";

type DataStateProps = {
  status: DataStateStatus;
  /** Le contenu à afficher en `success` */
  children: React.ReactNode;

  /** En `loading`, skeleton custom. Sinon skeleton générique 3 lignes. */
  skeleton?: React.ReactNode;

  /** En `error`, message à afficher. Default contextualisé selon le type. */
  errorTitle?: string;
  errorDescription?: string;
  errorType?: "network" | "server" | "permission" | "unknown";
  onRetry?: () => void;

  /** En `empty`, contenu à afficher. */
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;

  className?: string;
};

const ERROR_DEFAULTS = {
  network: {
    icon: WifiOff,
    title: "Connexion interrompue",
    description:
      "Impossible de joindre nos serveurs. Vérifiez votre connexion et réessayez.",
  },
  server: {
    icon: AlertTriangle,
    title: "Erreur serveur",
    description:
      "Quelque chose s'est mal passé de notre côté. Notre équipe a été alertée.",
  },
  permission: {
    icon: AlertTriangle,
    title: "Accès refusé",
    description:
      "Vous n'avez pas les droits nécessaires pour voir ces informations.",
  },
  unknown: {
    icon: AlertTriangle,
    title: "Erreur inattendue",
    description:
      "Une erreur que nous n'avons pas su catégoriser. Réessayez ou contactez le support.",
  },
};

export function DataState({
  status,
  children,
  skeleton,
  errorTitle,
  errorDescription,
  errorType = "unknown",
  onRetry,
  emptyIcon,
  emptyTitle = "Rien à afficher",
  emptyDescription,
  emptyAction,
  className,
}: DataStateProps) {
  if (status === "success") {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className={cn("flex flex-col gap-3", className)} aria-busy="true">
        {skeleton ?? (
          <>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </>
        )}
      </div>
    );
  }

  if (status === "error") {
    const defaults = ERROR_DEFAULTS[errorType];
    const ErrorIcon = defaults.icon;
    return (
      <div
        className={cn(
          "rounded-md border border-error/20 bg-error/5 px-6 py-8 text-center",
          className
        )}
        role="alert"
      >
        <div
          className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-error/10 text-error"
          aria-hidden
        >
          <ErrorIcon className="h-5 w-5" />
        </div>
        <h3 className="font-serif text-base font-medium text-ink">
          {errorTitle ?? defaults.title}
        </h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-soft">
          {errorDescription ?? defaults.description}
        </p>
        {onRetry && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            className="mt-4"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />}
          >
            Réessayer
          </Button>
        )}
      </div>
    );
  }

  // empty
  return (
    <EmptyState
      icon={emptyIcon}
      title={emptyTitle}
      description={emptyDescription}
      action={emptyAction}
      className={className}
    />
  );
}
