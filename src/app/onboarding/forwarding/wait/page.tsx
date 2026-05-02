import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Mail, ArrowRight, Inbox } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CopyAliasButton } from "../_components/copy-alias-button";
import { getInboundDomain } from "@/lib/inbound-email";

/**
 * Onboarding forwarding · étape 3 — confirmation + écran d'attente premier email.
 *
 * On affiche un récap : l'alias, le nombre de villas créées, et on attend
 * que les emails commencent à arriver naturellement.
 *
 * Étape suivante : redirige vers /onboarding/whatsapp pour finir l'inscription
 * (numéro WhatsApp + paiement Stripe — flow commun avec OAuth).
 */
export default async function ForwardingWaitPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { inboundAlias: true },
  });
  if (!user?.inboundAlias) {
    redirect("/onboarding/forwarding");
  }

  const villaCount = await prisma.villa.count({
    where: { userId: session.user.id, deletedAt: null },
  });
  if (villaCount === 0) {
    redirect("/onboarding/forwarding/villas");
  }

  const fullAddress = `${user.inboundAlias}@${getInboundDomain()}`;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-6 py-10 sm:py-14">
      <div className="text-eyebrow mb-3">Étape 3 sur 3 · Configuration terminée</div>
      <h1 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
        On <em className="text-aubergine-medium">veille</em> sur votre boîte mail
      </h1>
      <p className="mt-3 text-base text-ink-soft">
        Tout est prêt côté hostelyo. Les emails Airbnb que vous nous transférez seront
        analysés en quelques secondes, et vous recevrez une alerte WhatsApp uniquement
        sur les vraies urgences.
      </p>

      <Card padding="md" className="mt-6 border-success/30 bg-success/5">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="h-5 w-5 flex-shrink-0 text-success mt-0.5"
            aria-hidden
          />
          <div className="text-sm">
            <div className="font-medium text-aubergine">
              {villaCount} villa{villaCount > 1 ? "s" : ""} enregistrée{villaCount > 1 ? "s" : ""}
            </div>
            <p className="mt-1 text-ink-soft">
              Vous pourrez en ajouter ou en retirer à tout moment depuis votre dashboard.
            </p>
          </div>
        </div>
      </Card>

      <Card padding="md" className="mt-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-aubergine-50 text-aubergine">
            <Mail className="h-4 w-4" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-eyebrow mb-1">Adresse de transfert</div>
            <div className="font-mono text-sm text-aubergine break-all">
              {fullAddress}
            </div>
          </div>
          <CopyAliasButton address={fullAddress} />
        </div>
      </Card>

      {/* Test : envoyer un email de test pour vérifier le pipeline */}
      <Card padding="md" variant="muted" className="mt-3">
        <div className="flex items-start gap-3">
          <Inbox
            className="h-4 w-4 flex-shrink-0 text-ink-soft mt-0.5"
            aria-hidden
          />
          <div className="text-sm text-ink-soft">
            <strong className="text-aubergine">En attente du premier message.</strong>{" "}
            Dès qu'un email Airbnb arrive sur votre alias, hostelyo le détectera et
            l'analysera. Vous verrez les messages reçus dans votre dashboard, onglet{" "}
            <strong>Alertes</strong> (à venir).
            <br />
            <br />
            <strong>Astuce</strong> : pour tester tout de suite, envoyez-vous un email
            depuis votre adresse Airbnb (ou utilisez le formulaire de contact d'une de
            vos annonces). Vous devriez voir l'email arriver dans hostelyo dans les 30
            secondes.
          </div>
        </div>
      </Card>

      <div className="mt-10 flex flex-col items-center gap-3 border-t border-border pt-8">
        <Button asChild size="lg">
          <Link href="/onboarding/whatsapp">
            Continuer vers le numéro d'alerte WhatsApp
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <p className="text-xs text-ink-muted text-center max-w-md">
          Plus que 2 étapes : numéro WhatsApp, puis choix de votre forfait.
        </p>
      </div>
    </div>
  );
}
