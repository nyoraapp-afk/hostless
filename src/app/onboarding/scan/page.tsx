"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Search, Building2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Page p3 — Auto-détection.
 * Stub Phase 1.A : montre l'animation + CTA vers /onboarding/villas.
 *
 * TODO Phase 1.A++ — appeler la Gmail API avec session.accessToken pour scanner
 * vraiment les emails Airbnb des 90 derniers jours et extraire les villas.
 *
 * TODO Phase 1.B — persister le résultat en DB (Villa) une fois Supabase branché.
 */
export default function ScanPage() {
  const [step, setStep] = React.useState(0);
  const steps: { icon: React.ReactNode; label: string; sublabel: string }[] = [
    {
      icon: <Mail className="h-4 w-4" aria-hidden />,
      label: "Connexion à votre boîte mail Airbnb",
      sublabel: "Lecture seule, scope gmail.readonly",
    },
    {
      icon: <Search className="h-4 w-4" aria-hidden />,
      label: "Analyse des 90 derniers jours",
      sublabel: "On cherche les emails de notification Airbnb",
    },
    {
      icon: <Building2 className="h-4 w-4" aria-hidden />,
      label: "Extraction de vos villas et réservations",
      sublabel: "Identification automatique des listings",
    },
  ];

  React.useEffect(() => {
    const t = setTimeout(() => {
      setStep((s) => Math.min(s + 1, steps.length));
    }, 1500);
    return () => clearTimeout(t);
  }, [step]);

  const allDone = step >= steps.length;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-12 sm:py-16">
      <div className="text-eyebrow mb-3">Étape 1 sur 6</div>
      <h1 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl text-center">
        On installe <em className="text-aubergine-medium">votre tranquillité</em>
      </h1>
      <p className="mt-3 text-center text-base text-ink-soft max-w-md">
        hostelyo est en train de lire votre activité Airbnb. Aucune action de
        votre part — restez sur cette page quelques secondes.
      </p>

      <Card padding="md" className="mt-8 w-full">
        <ul className="flex flex-col gap-4">
          {steps.map((s, i) => {
            const isDone = i < step;
            const isActive = i === step;
            const isPending = i > step;
            return (
              <li
                key={i}
                className="flex items-start gap-3"
                aria-current={isActive ? "step" : undefined}
              >
                <div
                  className={
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors " +
                    (isDone
                      ? "bg-success/15 text-success"
                      : isActive
                      ? "bg-aubergine text-on-aubergine animate-pulse"
                      : "bg-cream-warm text-ink-muted")
                  }
                  aria-hidden
                >
                  {isDone ? (
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

      {allDone && (
        <div className="mt-8 flex w-full flex-col items-center gap-3">
          <Card variant="muted" padding="md" className="w-full">
            <p className="text-sm text-ink-soft">
              <strong className="text-aubergine">Phase 1.A · stub</strong> — La
              vraie logique de scan Gmail (parsing des emails Airbnb des 90
              derniers jours) sera branchée une fois la base Supabase
              configurée. En l'état, votre connexion Google est valide et vos
              tokens sont en mémoire de session.
            </p>
          </Card>
          <Button asChild size="lg">
            <Link href="/onboarding/villas">
              Continuer
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
