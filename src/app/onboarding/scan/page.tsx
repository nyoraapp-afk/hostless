"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Search,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveOnboarding } from "@/lib/onboarding-state";

/**
 * Page p3 — Scan réel de la boîte Gmail.
 *
 * Lance POST /api/onboarding/scan au montage de la page :
 *   1. Le serveur parle à Gmail API via les tokens OAuth (déjà obtenus à la connexion)
 *   2. Récupère les emails Airbnb des 90 derniers jours
 *   3. Extrait les listing IDs uniques + noms (best-effort)
 *   4. Crée les Villa en DB pour cet user
 *   5. Met à jour EmailAccount.lastSyncAt pour que le cron Inngest reprenne
 *
 * Pendant que le scan tourne, on affiche une animation avec 3 étapes successives.
 * À la fin, on affiche le résultat (X villas trouvées) et un CTA vers /onboarding/villas
 * où l'utilisateur peut renommer / supprimer / ajouter.
 */

type ScanResult = {
  ok: boolean;
  emailsScanned: number;
  villas: Array<{ id: string; name: string; airbnbId: string | null; status: string }>;
};

type ScanState =
  | { kind: "scanning"; step: number }
  | { kind: "done"; result: ScanResult }
  | { kind: "error"; message: string; hint?: string; reauth?: boolean };

const STEPS = [
  {
    icon: <Mail className="h-4 w-4" aria-hidden />,
    label: "Connexion à votre boîte Gmail",
    sublabel: "Lecture seule, scope gmail.readonly",
  },
  {
    icon: <Search className="h-4 w-4" aria-hidden />,
    label: "Analyse des 90 derniers jours",
    sublabel: "Recherche des notifications Airbnb",
  },
  {
    icon: <Building2 className="h-4 w-4" aria-hidden />,
    label: "Extraction de vos villas",
    sublabel: "Identification automatique des listings",
  },
];

export default function ScanPage() {
  const router = useRouter();
  const [state, setState] = React.useState<ScanState>({
    kind: "scanning",
    step: 0,
  });

  // Animation locale des 3 étapes (purement visuelle pendant que l'API tourne)
  React.useEffect(() => {
    if (state.kind !== "scanning") return;
    if (state.step >= STEPS.length - 1) return;
    const t = setTimeout(() => {
      setState((s) =>
        s.kind === "scanning" && s.step < STEPS.length - 1
          ? { kind: "scanning", step: s.step + 1 }
          : s
      );
    }, 1500);
    return () => clearTimeout(t);
  }, [state]);

  // Lancement réel du scan au montage
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/onboarding/scan", { method: "POST" });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setState({
            kind: "error",
            message: data.error ?? "Erreur lors du scan",
            hint: data.hint,
            reauth: data.code === "REAUTH_REQUIRED",
          });
          return;
        }

        // Sauvegarde le résultat dans sessionStorage pour que /onboarding/villas
        // puisse adapter son UI (ex: bloquer l'ajout manuel si emailsScanned === 0).
        const result = data as ScanResult;
        saveOnboarding({ emailsScanned: result.emailsScanned });

        setState({ kind: "done", result });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Erreur réseau";
        setState({
          kind: "error",
          message,
          hint: "Vérifiez votre connexion internet et réessayez.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-12 sm:py-16">
      <div className="text-eyebrow mb-3">Étape 1 sur 6</div>
      <h1 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl text-center">
        On installe <em className="text-aubergine-medium">votre tranquillité</em>
      </h1>
      <p className="mt-3 text-center text-base text-ink-soft max-w-md">
        hostelyo lit votre activité Airbnb. Aucune action de votre part — restez
        sur cette page le temps du scan (10 à 30 secondes).
      </p>

      <Card padding="md" className="mt-8 w-full">
        <ul className="flex flex-col gap-4">
          {STEPS.map((s, i) => {
            const activeStep = state.kind === "scanning" ? state.step : STEPS.length;
            const isDone =
              state.kind === "done" || (state.kind === "scanning" && i < activeStep);
            const isActive = state.kind === "scanning" && i === activeStep;
            const isPending = state.kind === "scanning" && i > activeStep;
            return (
              <li
                key={i}
                className="flex items-start gap-3"
                aria-current={isActive ? "step" : undefined}
              >
                <div
                  className={
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors " +
                    (state.kind === "error"
                      ? "bg-error/15 text-error"
                      : isDone
                      ? "bg-success/15 text-success"
                      : isActive
                      ? "bg-aubergine text-on-aubergine animate-pulse"
                      : "bg-cream-warm text-ink-muted")
                  }
                  aria-hidden
                >
                  {state.kind === "error" ? (
                    <AlertCircle className="h-4 w-4" aria-hidden />
                  ) : isDone ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  ) : (
                    s.icon
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <div
                    className={
                      "text-sm font-medium " +
                      (isPending ? "text-ink-muted" : "text-ink")
                    }
                  >
                    {s.label}
                  </div>
                  <div className="text-xs text-ink-muted mt-0.5">
                    {s.sublabel}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Résultat — succès */}
      {state.kind === "done" && (
        <div className="mt-8 flex w-full flex-col items-center gap-3">
          <Card variant="muted" padding="md" className="w-full">
            <p className="text-sm text-ink-soft">
              <strong className="text-aubergine">
                {state.result.villas.length === 0
                  ? "Aucune villa détectée"
                  : `${state.result.villas.length} villa${
                      state.result.villas.length > 1 ? "s" : ""
                    } détectée${state.result.villas.length > 1 ? "s" : ""}`}
              </strong>
              {" — "}
              {state.result.emailsScanned} email
              {state.result.emailsScanned > 1 ? "s" : ""} Airbnb analysé
              {state.result.emailsScanned > 1 ? "s" : ""} sur les 90 derniers
              jours.
              {state.result.villas.length === 0 && (
                <>
                  {" "}
                  Vous pourrez en ajouter manuellement à l'étape suivante.
                </>
              )}
            </p>
          </Card>
          <Button
            size="lg"
            onClick={() => router.push("/onboarding/villas")}
          >
            Continuer
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      )}

      {/* Résultat — erreur */}
      {state.kind === "error" && (
        <div className="mt-8 flex w-full flex-col items-center gap-3">
          <Card padding="md" className="w-full border-error/30 bg-error/5">
            <p className="text-sm font-medium text-error mb-1">
              Le scan n'a pas abouti
            </p>
            <p className="text-sm text-ink-soft">{state.message}</p>
            {state.hint && (
              <p className="text-xs text-ink-muted mt-2">{state.hint}</p>
            )}
          </Card>
          {state.reauth ? (
            <Button asChild size="lg">
              <Link href="/login">Se reconnecter avec Google</Link>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} size="md">
                Réessayer
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push("/onboarding/villas")}
                size="md"
              >
                Continuer sans scan
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
