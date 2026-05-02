import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { StaticPageShell } from "@/components/static-page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLAN_PRICES } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "hostelyo coûte 89€ ou 129€ par villa et par mois, sans engagement. Choisissez Essentiel pour des alertes WhatsApp ciblées, ou Sérénité pour le dispatch automatique vers votre équipe.",
};

export default function TarifsPage() {
  return (
    <StaticPageShell
      eyebrow="Tarifs"
      title={
        <>
          Choisissez votre <em className="text-aubergine-medium">niveau de tranquillité</em>
        </>
      }
    >
      <p>
        Une formule par villa, mensuelle, sans engagement. Vous pouvez basculer d'une
        formule à l'autre à tout moment depuis votre dashboard — Stripe gère le prorata
        automatiquement.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 not-prose">
        {/* Essentiel */}
        <Card className="border-2 border-border" padding="md">
          <h2 className="font-serif text-xl font-medium text-aubergine">Essentiel</h2>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-3xl font-semibold text-ink">
              {formatPrice(PLAN_PRICES.ESSENTIEL)}
            </span>
            <span className="text-sm text-ink-muted">/ villa / mois</span>
          </div>
          <p className="mt-3 text-sm font-medium text-aubergine-medium">
            Vous êtes alertée uniquement quand nécessaire.
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-ink-soft">
            <FeatureItem>Veille 24h/24 de vos messages Airbnb</FeatureItem>
            <FeatureItem>Classification IA Claude Sonnet (urgent / routinier / spam)</FeatureItem>
            <FeatureItem>Alertes WhatsApp uniquement sur les vraies urgences</FeatureItem>
            <FeatureItem>Filtrage intelligent (vos automatismes Airbnb restent actifs)</FeatureItem>
            <FeatureItem>Dashboard pour gérer vos villas + voir l'historique</FeatureItem>
            <FeatureItem>Support email sous 24h ouvrées</FeatureItem>
          </ul>
          <div className="mt-6">
            <Button asChild block variant="secondary">
              <Link href="/login">Commencer avec Essentiel</Link>
            </Button>
          </div>
        </Card>

        {/* Sérénité */}
        <Card className="relative border-2 border-aubergine shadow-md" padding="md">
          <Badge
            variant="premium"
            size="sm"
            className="absolute -top-2.5 right-4 shadow-sm"
          >
            <Sparkles className="h-3 w-3" aria-hidden />
            Recommandé
          </Badge>
          <h2 className="font-serif text-xl font-medium text-aubergine">Sérénité</h2>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-mono text-3xl font-semibold text-ink">
              {formatPrice(PLAN_PRICES.SERENITE)}
            </span>
            <span className="text-sm text-ink-muted">/ villa / mois</span>
          </div>
          <p className="mt-3 text-sm font-medium text-aubergine-medium">
            Vous êtes alertée. Votre équipe est prévenue.
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-ink-soft">
            <FeatureItem>
              <strong>Tout ce qui est dans Essentiel</strong>
            </FeatureItem>
            <FeatureItem>
              <strong>Dispatch automatique</strong> vers vos intervenants (ménage, piscine,
              jardin, maintenance, accueil, autre)
            </FeatureItem>
            <FeatureItem>Configuration équipe par défaut + exceptions par villa</FeatureItem>
            <FeatureItem>Vous restez en copie de chaque envoi</FeatureItem>
            <FeatureItem>Suivi des accusés de lecture WhatsApp</FeatureItem>
          </ul>
          <div className="mt-6">
            <Button asChild block>
              <Link href="/login">Commencer avec Sérénité</Link>
            </Button>
          </div>
        </Card>
      </div>

      <Card padding="md" variant="muted" className="mt-8 not-prose">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 mt-0.5 flex-shrink-0 text-success" aria-hidden />
          <div className="text-sm">
            <p className="font-medium text-aubergine">
              Sans engagement, résiliable à tout moment
            </p>
            <p className="mt-1 text-ink-soft">
              Vous gardez le service jusqu'à la fin du cycle facturé en cours, puis aucun
              prélèvement n'est effectué. Pas de pénalité, pas de questions.
            </p>
          </div>
        </div>
      </Card>

      <h2>Questions fréquentes</h2>

      <h3>Le tarif est-il par villa ou par compte ?</h3>
      <p>
        <strong>Par villa</strong>. Si vous avez 3 villas en Sérénité, c'est 3 × 129€ =
        387€/mois. Cohérent avec votre activité : plus vous gérez de villas, plus
        hostelyo travaille pour vous.
      </p>

      <h3>Puis-je changer de formule en cours de mois ?</h3>
      <p>
        Oui, à tout moment depuis votre dashboard, onglet Compte. Si vous passez à
        Sérénité, c'est immédiat avec un crédit Stripe au prorata. Si vous repassez à
        Essentiel, ça prend effet à la fin du cycle pour ne pas couper votre équipe en
        plein mois.
      </p>

      <h3>Que se passe-t-il si je résilie ?</h3>
      <p>
        Votre service reste actif jusqu'à la date de fin du cycle (date affichée dans
        votre dashboard). Aucun prélèvement après cette date. Vos données historiques
        (alertes envoyées, configuration équipe) sont conservées 90 jours pour un export
        comptable, puis supprimées.
      </p>

      <h3>Y a-t-il des frais cachés ?</h3>
      <p>
        Non. Le prix affiché est le prix payé. Pas de frais d'installation, pas de
        commission par alerte, pas de surcoût pour le support. Stripe vous envoie une
        facture mensuelle claire avec le détail.
      </p>

      <h3>Hostelyo est-il déductible ?</h3>
      <p>
        Si votre activité Airbnb est déclarée (LMNP, SCI, conciergerie professionnelle…),
        oui — c'est un outil métier. La facture Stripe sert de justificatif comptable.
        Demandez à votre comptable pour votre situation précise.
      </p>

      <div className="mt-10 flex justify-center not-prose">
        <Button asChild size="lg">
          <Link href="/login">
            Commencer maintenant
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </StaticPageShell>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-success" strokeWidth={2.5} aria-hidden />
      <span>{children}</span>
    </li>
  );
}
