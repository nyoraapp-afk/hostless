import Link from "next/link";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { ensureInboundAlias } from "./_actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ForwardingTutorials } from "./_components/forwarding-tutorials";
import { CopyAliasButton } from "./_components/copy-alias-button";

/**
 * Onboarding forwarding · étape 1 — alias + tutoriel.
 *
 * On crée (ou récupère) l'alias `*@in.hostelyo.com` du user, on l'affiche en grand,
 * et on lui montre comment configurer le forwarding sur son provider email.
 *
 * Étape suivante (après config) : /onboarding/forwarding/villas → saisie villas.
 */
export default async function ForwardingSetupPage() {
  // Crée l'alias côté serveur dès l'arrivée (idempotent)
  const { fullAddress } = await ensureInboundAlias();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10 sm:py-14">
      <div className="text-eyebrow mb-3">Étape 1 sur 3 · Configurer le transfert</div>
      <h1 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
        Voici votre <em className="text-aubergine-medium">adresse hostelyo</em>
      </h1>
      <p className="mt-3 text-base text-ink-soft">
        Configurez votre boîte mail Airbnb pour transférer automatiquement les messages
        vers cette adresse. hostelyo les analysera et vous alertera uniquement sur les
        urgences.
      </p>

      {/* Alias en très grand, copiable */}
      <Card padding="md" className="mt-6 border-2 border-aubergine bg-aubergine-50/50">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-aubergine text-on-aubergine">
            <Mail className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-eyebrow mb-1">Votre adresse de transfert</div>
            <div className="font-mono text-base sm:text-lg font-medium text-aubergine break-all">
              {fullAddress}
            </div>
            <p className="mt-2 text-xs text-ink-soft">
              Unique à votre compte. Personne d'autre ne peut envoyer ici à votre place.
              Conservez-la précieusement.
            </p>
          </div>
          <CopyAliasButton address={fullAddress} />
        </div>
      </Card>

      {/* Avertissement sécurité */}
      <Card padding="md" className="mt-4" variant="muted">
        <div className="flex items-start gap-3">
          <ShieldCheck
            className="h-4 w-4 flex-shrink-0 text-success mt-0.5"
            aria-hidden
          />
          <div className="text-xs text-ink-soft leading-relaxed">
            <strong className="text-aubergine">Aucun accès à votre boîte mail.</strong>{" "}
            On ne reçoit que les messages que vous nous transférez. Vous pouvez
            arrêter le transfert à tout moment depuis votre boîte mail.
          </div>
        </div>
      </Card>

      {/* Tutoriels par provider */}
      <h2 className="mt-10 font-serif text-xl font-medium text-aubergine">
        Comment configurer le transfert ?
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        Suivez le tutoriel selon votre fournisseur d'email Airbnb.
      </p>

      <ForwardingTutorials alias={fullAddress} />

      {/* CTA continue */}
      <div className="mt-10 flex flex-col items-center gap-3 border-t border-border pt-8">
        <Button asChild size="lg">
          <Link href="/onboarding/forwarding/villas">
            Configuration faite, continuer
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <p className="text-xs text-ink-muted text-center max-w-md">
          Pas obligé d'avoir terminé la config maintenant — vous pouvez revenir sur cet
          écran depuis votre dashboard à tout moment.
        </p>
      </div>
    </div>
  );
}
