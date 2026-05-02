import Link from "next/link";
import { CheckCircle2, ArrowRight, Mail, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { auth } from "@/auth";
import { verifyAndPersistSubscription } from "@/lib/subscription-from-checkout";
import { ClearOnboardingEffect } from "./clear-onboarding-effect";
import { PLAN_LABELS, type PlanSlug } from "@/lib/types";

/**
 * Page p9 — Confirmation post-paiement Stripe.
 *
 * Stripe redirige ici avec ?session_id={CHECKOUT_SESSION_ID} après paiement réussi.
 *
 * On vérifie côté serveur que la session est bien finalisée, on persiste
 * la Subscription en DB, puis on affiche la confirmation.
 *
 * Cette approche remplace le webhook Stripe pour le cas "création initiale" —
 * en local, où stripe-cli est bloqué (DNS/ISP), c'est plus simple. En prod
 * on basculera sur le vrai webhook qui gère aussi les events post-souscription.
 */
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;
  const session = await auth();

  // Tente de vérifier + persister la subscription
  const result = sessionId
    ? await verifyAndPersistSubscription(sessionId, session?.user?.id)
    : { ok: false as const, error: "Aucun session_id dans l'URL." };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-16 sm:py-24 text-center">
      <ClearOnboardingEffect />

      {result.ok ? <SuccessUI planSlug={result.planSlug as PlanSlug} /> : <DegradedUI error={result.error} />}

      {sessionId && (
        <p className="mt-6 text-xs text-ink-muted">
          Session Stripe :{" "}
          <code className="rounded bg-cream-warm px-1.5 py-0.5 font-mono text-[10px]">
            {sessionId}
          </code>
        </p>
      )}

      <Button asChild size="lg" className="mt-8">
        <Link href="/dashboard">
          Accéder à mon dashboard
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Button>

      <div className="mt-12 border-t border-border pt-6 w-full">
        <Logo size="sm" />
      </div>
    </div>
  );
}

function SuccessUI({ planSlug }: { planSlug: PlanSlug }) {
  const planLabel = PLAN_LABELS[planSlug] ?? planSlug;
  return (
    <>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 className="h-8 w-8" aria-hidden />
      </div>

      <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
        Bienvenue chez <em className="text-aubergine-medium">hostelyo</em>
        <span className="text-powder">.</span>
      </h1>

      <p className="mt-4 max-w-md text-base text-ink-soft">
        Votre paiement est confirmé. Votre forfait{" "}
        <strong className="text-aubergine">{planLabel}</strong> est actif et
        hostelyo commence à veiller sur vos villas{" "}
        <strong className="text-aubergine">dès maintenant</strong>. Vous
        recevrez une alerte WhatsApp uniquement quand votre intervention sera
        nécessaire.
      </p>

      <Card padding="md" variant="muted" className="mt-8 w-full text-left">
        <h2 className="font-serif text-base font-medium text-aubergine">
          Et maintenant ?
        </h2>
        <ul className="mt-3 space-y-2.5 text-sm text-ink-soft">
          <li className="flex items-start gap-2">
            <Mail
              className="h-4 w-4 mt-0.5 flex-shrink-0 text-aubergine-medium"
              aria-hidden
            />
            <span>
              Un email de confirmation Stripe vous a été envoyé avec votre reçu.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2
              className="h-4 w-4 mt-0.5 flex-shrink-0 text-success"
              aria-hidden
            />
            <span>
              Vous pouvez gérer vos villas, votre équipe et votre forfait à
              tout moment depuis votre dashboard.
            </span>
          </li>
        </ul>
      </Card>
    </>
  );
}

function DegradedUI({ error }: { error: string }) {
  return (
    <>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-soft/60 text-[#7A6432]">
        <AlertTriangle className="h-8 w-8" aria-hidden />
      </div>

      <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
        Paiement reçu, <em className="text-aubergine-medium">vérification en cours</em>
      </h1>

      <p className="mt-4 max-w-md text-base text-ink-soft">
        Stripe a bien enregistré votre paiement, mais nous n'avons pas pu finaliser
        l'activation côté hostelyo. Notre équipe vérifie — vous recevrez un email
        de confirmation dès que c'est résolu.
      </p>

      <Card padding="md" variant="muted" className="mt-6 w-full text-left">
        <p className="font-mono text-xs text-ink-muted">{error}</p>
      </Card>
    </>
  );
}
