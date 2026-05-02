"use client";

import Link from "next/link";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Section pricing — 2 forfaits côte à côte.
 * Port de v34 p1 #section-pricing (lignes 908-939).
 */
export function Pricing() {
  return (
    <section
      id="pricing"
      className="bg-cream px-6 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-eyebrow mb-3">Tarifs</div>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
          Choisissez votre <em className="text-aubergine-medium">niveau de tranquillité</em>
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {/* Essentiel */}
          <PlanCard
            name="Essentiel"
            price={89}
            promise="Vous êtes alertée uniquement quand nécessaire."
            description="hostelyo analyse vos messages 24h/24 et vous prévient sur WhatsApp pour tout ce qui demande votre intervention."
          />

          {/* Sérénité (recommandé) */}
          <PlanCard
            name="Sérénité"
            price={129}
            promise="Vous êtes alertée. Votre équipe est prévenue."
            description="hostelyo prévient directement le bon intervenant selon le type de problème. Vous restez toujours en copie."
            recommended
          />
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button asChild size="lg">
            <Link href="/login">Commencer maintenant</Link>
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Lock className="h-3 w-3" aria-hidden />
            Paiement sécurisé via Stripe · Sans engagement
          </p>
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  name,
  price,
  promise,
  description,
  recommended,
}: {
  name: string;
  price: number;
  promise: string;
  description: string;
  recommended?: boolean;
}) {
  return (
    <Card
      className={
        recommended
          ? "relative border-2 border-powder shadow-sm"
          : "relative border-2 border-border hover:border-aubergine-soft transition-colors"
      }
      padding="md"
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
      <div className="font-serif text-lg font-medium text-aubergine">
        {name}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-semibold text-ink">
          {price}€
        </span>
        <span className="text-xs text-ink-muted">/ villa / mois</span>
      </div>
      <p className="mt-3 text-sm font-medium text-aubergine-medium leading-snug">
        {promise}
      </p>
      <p className="mt-2 text-sm text-ink-muted leading-relaxed">
        {description}
      </p>
      <div className="mt-5 flex items-center gap-1 text-xs font-medium text-aubergine-medium">
        Voir le détail
        <ArrowRight className="h-3 w-3" aria-hidden />
      </div>
    </Card>
  );
}
