"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OnboardingStepper } from "@/components/onboarding/stepper";
import { loadOnboarding, saveOnboarding } from "@/lib/onboarding-state";
import { PLAN_LABELS, PLAN_PRICES, type PlanSlug } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";

/**
 * Page p6 — Sélection forfait.
 *
 * Affiche les 2 forfaits avec :
 *   - Promesse + features clés
 *   - Prix par villa (lu depuis lib/types — source de vérité unique, Pattern 10)
 *   - Total dynamique selon le nombre de villas du flow
 *
 * Le clic "Continuer" enchaîne vers :
 *   - /onboarding/equipe si Sérénité
 *   - /onboarding/recap si Essentiel (équipe non requise)
 */
export default function ForfaitPage() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<PlanSlug | null>(null);
  const [villaCount, setVillaCount] = React.useState(0);

  React.useEffect(() => {
    const saved = loadOnboarding();
    if (saved.plan) setSelected(saved.plan);
    setVillaCount(saved.villas.filter((v) => !v.removed).length);
  }, []);

  // Toujours en vouvoiement (cf. brand voice)
  function pick(plan: PlanSlug) {
    setSelected(plan);
    saveOnboarding({ plan });
  }

  function handleContinue() {
    if (!selected) return;
    if (selected === "SERENITE") {
      router.push("/onboarding/equipe");
    } else {
      router.push("/onboarding/recap");
    }
  }

  return (
    <>
      <OnboardingStepper current={4} total={6} label="Choix du forfait" />

      <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:py-10">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
          Choisis ton <em className="text-aubergine-medium">niveau de tranquillité</em>
        </h1>
        <p className="mt-3 text-base text-ink-soft">
          {villaCount > 0 ? (
            <>
              Vous avez <strong className="text-aubergine">{villaCount} villa{villaCount > 1 ? "s" : ""}</strong> à monitorer. Le tarif est par villa, mensuel, sans engagement.
            </>
          ) : (
            "Tarif par villa, mensuel, sans engagement."
          )}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <PlanCard
            plan="ESSENTIEL"
            selected={selected === "ESSENTIEL"}
            onSelect={pick}
            villaCount={villaCount}
            features={[
              "Analyse 24h/24 des messages Airbnb",
              "Alertes WhatsApp pour vraies urgences",
              "Filtrage intelligent (faux positifs réduits)",
              "Sans engagement, résiliable à tout moment",
            ]}
          />
          <PlanCard
            plan="SERENITE"
            selected={selected === "SERENITE"}
            onSelect={pick}
            villaCount={villaCount}
            recommended
            features={[
              "Tout ce que contient Essentiel",
              "Dispatch automatique vers vos intervenants",
              "Configuration 6 catégories (ménage, piscine, jardin…)",
              "Exceptions par villa possibles",
              "Vous restez en copie de chaque alerte",
            ]}
          />
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selected}
            rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />}
          >
            Continuer
          </Button>
          {selected && (
            <p className="text-xs text-ink-muted">
              Total mensuel à venir :{" "}
              <strong className="font-mono text-aubergine">
                {formatPrice(PLAN_PRICES[selected] * villaCount)}
              </strong>
              {selected === "SERENITE" && villaCount > 0 && (
                <> — équipe à configurer à l'étape suivante</>
              )}
            </p>
          )}
        </div>
      </div>

      <Toaster />
    </>
  );
}

function PlanCard({
  plan,
  selected,
  onSelect,
  villaCount,
  features,
  recommended,
}: {
  plan: PlanSlug;
  selected: boolean;
  onSelect: (p: PlanSlug) => void;
  villaCount: number;
  features: string[];
  recommended?: boolean;
}) {
  const price = PLAN_PRICES[plan];
  const total = villaCount > 0 ? price * villaCount : 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(plan)}
      className={cn(
        "relative text-left transition-all rounded-md",
        selected ? "ring-2 ring-aubergine ring-offset-2 ring-offset-cream" : ""
      )}
      aria-pressed={selected}
    >
      <Card
        padding="md"
        className={cn(
          "h-full border-2 transition-colors",
          recommended ? "border-powder" : "border-border",
          selected && "border-aubergine"
        )}
      >
        {recommended && (
          <Badge
            variant="premium"
            size="sm"
            className="absolute -top-2.5 right-4 shadow-sm"
          >
            <Sparkles className="h-3 w-3" aria-hidden />
            Recommandé
          </Badge>
        )}
        {selected && (
          <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-aubergine text-on-aubergine">
            <Check className="h-3.5 w-3.5" aria-hidden strokeWidth={3} />
          </div>
        )}

        <div className="font-serif text-lg font-medium text-aubergine">
          {PLAN_LABELS[plan]}
        </div>

        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-mono text-2xl font-semibold text-ink">
            {price}€
          </span>
          <span className="text-xs text-ink-muted">/ villa / mois</span>
        </div>
        {villaCount > 0 && (
          <div className="mt-1 text-xs text-ink-muted">
            soit{" "}
            <strong className="font-mono text-aubergine">
              {formatPrice(total)}
            </strong>
            /mois pour {villaCount} villa{villaCount > 1 ? "s" : ""}
          </div>
        )}

        <ul className="mt-5 space-y-2">
          {features.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-ink-soft"
            >
              <Check
                className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-success"
                aria-hidden
                strokeWidth={2.5}
              />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {plan === "SERENITE" && (
          <div className="mt-5 flex items-center gap-2 rounded-sm bg-aubergine-50 px-3 py-2 text-xs text-aubergine">
            <Users className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
            <span>
              Configuration de l'équipe à l'étape suivante (5 minutes).
            </span>
          </div>
        )}
      </Card>
    </button>
  );
}
