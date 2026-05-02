"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "hostelyo-cookie-consent-v1";

type ConsentStatus = "accepted" | "declined" | null;

/**
 * Bannière RGPD minimaliste, conforme au principe "consentement explicite avant pose de cookies tiers".
 *
 * Hostelyo ne pose **que des cookies essentiels** (session d'auth Auth.js).
 * Pas de tracking, pas de pub. La bannière sert principalement à :
 *   1. Informer l'utilisateur du fait
 *   2. Pointer vers /privacy pour plus de détails
 *
 * Comme on n'utilise pas de cookies tiers à blocker, on demande "OK / En savoir plus"
 * plutôt qu'un vrai opt-in granulaire (qui serait surdimensionné pour notre cas).
 *
 * Si on ajoute Sentry / analytics plus tard avec consentement, on enrichit ce composant
 * pour gérer un opt-in/opt-out par catégorie.
 */
export function CookieBanner() {
  const [status, setStatus] = React.useState<ConsentStatus>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ConsentStatus | null;
      setStatus(saved);
    } catch {
      // localStorage indispo (ex: navigation privée Firefox restreinte) — on affiche la bannière
    }
  }, []);

  function persist(value: ConsentStatus) {
    setStatus(value);
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }

  // Pas de rendu côté serveur (évite hydration mismatch + pas de cookies en SSR de toute façon)
  if (!hydrated) return null;

  // Déjà répondu → ne pas afficher
  if (status) return null;

  return (
    <div
      role="region"
      aria-label="Consentement aux cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-cream/95 backdrop-blur-md shadow-lg"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-aubergine-50 text-aubergine">
            <Cookie className="h-4 w-4" aria-hidden />
          </div>
          <div className="text-sm text-ink-soft leading-relaxed">
            hostelyo utilise uniquement des <strong className="text-aubergine">cookies essentiels</strong>{" "}
            au fonctionnement du service (session de connexion). Pas de tracking, pas de
            publicité, pas de cookies tiers.{" "}
            <Link
              href="/privacy"
              className="text-aubergine underline hover:text-aubergine-medium"
            >
              En savoir plus
            </Link>
            .
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => persist("declined")}
            aria-label="Refuser les cookies non essentiels"
          >
            Refuser
          </Button>
          <Button
            size="sm"
            onClick={() => persist("accepted")}
            aria-label="Accepter les cookies essentiels"
          >
            J'accepte
          </Button>
          <button
            type="button"
            onClick={() => persist("declined")}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-sm text-ink-muted hover:bg-cream-warm hover:text-ink"
            aria-label="Fermer la bannière"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
