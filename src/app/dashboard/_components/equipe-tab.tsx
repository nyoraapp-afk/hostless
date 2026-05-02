"use client";

import * as React from "react";
import Link from "next/link";
import { Users, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LockedFeature } from "@/components/patterns/locked-feature";
import { EmptyState } from "@/components/empty-state";
import { DISPATCH_CATEGORIES, type DispatchCategory } from "@/lib/types";
import type { DashboardData } from "@/lib/dashboard-data";

/**
 * Onglet Équipe du dashboard.
 *
 * - Si plan = Essentiel → LockedFeature (Pattern 1) avec CTA upgrade Sérénité
 * - Si plan = Sérénité → liste des intervenants groupés par personne, avec catégories couvertes
 *   + alerte sur les catégories non couvertes
 *
 * Les modifs (ajout/edit/suppression intervenant) seront ajoutées dans une 2e itération.
 */
export function EquipeTab({
  intervenants,
  uncoveredCategories,
  planSlug,
}: {
  intervenants: DashboardData["intervenants"];
  uncoveredCategories: DashboardData["uncoveredCategories"];
  planSlug: "ESSENTIEL" | "SERENITE" | null;
}) {
  if (planSlug !== "SERENITE") {
    return (
      <LockedFeature
        isLocked
        requiredPlan="SERENITE"
        reason="Le dispatch automatique vers vos intervenants — ménage, piscine, jardin, maintenance, accueil — est inclus dans Sérénité. C'est précisément ce qui transforme une alerte 'à gérer' en alerte 'déjà prise en charge'."
        onUpsellClick={() => {
          // Redirige vers l'onglet Compte où la modale de changement forfait est dispo
          window.location.href = "/dashboard?tab=compte";
        }}
      />
    );
  }

  if (intervenants.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-5 w-5" aria-hidden />}
        title="Aucun intervenant configuré"
        description="Sérénité n'a de valeur que si les alertes sont transmises à votre équipe. Sans intervenant configuré, toutes les alertes vous reviennent."
        action={
          <Button asChild size="sm">
            <Link href="/onboarding/equipe">Configurer mon équipe</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {uncoveredCategories.length > 0 && (
        <Card padding="md" className="border-gold/30 bg-gold-soft/30">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#7A6432]"
              aria-hidden
            />
            <div className="flex-1 text-sm">
              <p className="font-medium text-[#7A6432]">
                {uncoveredCategories.length} catégorie
                {uncoveredCategories.length > 1 ? "s" : ""} non couverte
                {uncoveredCategories.length > 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-ink-soft">
                Les alertes pour{" "}
                <strong>
                  {uncoveredCategories
                    .map((c) => DISPATCH_CATEGORIES.find((d) => d.id === c)?.label)
                    .join(", ")}
                </strong>{" "}
                vous reviennent directement. Configurez un intervenant pour ces catégories.
              </p>
            </div>
          </div>
        </Card>
      )}

      <p className="text-sm text-ink-soft">
        <strong className="text-aubergine">{intervenants.length}</strong> intervenant
        {intervenants.length > 1 ? "s" : ""} configuré{intervenants.length > 1 ? "s" : ""}{" "}
        sur 6 catégories
      </p>

      {intervenants.map((i) => (
        <IntervenantRow key={i.id} intervenant={i} />
      ))}
    </div>
  );
}

function IntervenantRow({
  intervenant,
}: {
  intervenant: DashboardData["intervenants"][number];
}) {
  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-aubergine text-on-aubergine text-sm font-semibold"
            aria-hidden
          >
            {intervenant.name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-ink">{intervenant.name}</div>
            <div className="font-mono text-xs text-ink-muted">{intervenant.phoneE164}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {intervenant.categories.length === 0 ? (
                <Badge variant="neutral" size="sm">
                  Aucune catégorie assignée
                </Badge>
              ) : (
                intervenant.categories.map((cat) => {
                  const meta = DISPATCH_CATEGORIES.find(
                    (d) => d.id === (cat as DispatchCategory)
                  );
                  return (
                    <Badge key={cat} variant="default" size="sm">
                      {meta?.label ?? cat}
                    </Badge>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
