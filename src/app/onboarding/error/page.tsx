"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Page p-err — Paiement Stripe annulé ou échoué.
 *
 * Stripe redirige ici via le `cancel_url` de la session Checkout.
 * Adresse Pattern 6 (états explicites) + Pattern 10 (copywriting précis sur l'erreur).
 */
export default function ErrorPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-6 py-16 sm:py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-error/15 text-error">
        <AlertTriangle className="h-8 w-8" aria-hidden />
      </div>

      <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
        Paiement <em className="text-aubergine-medium">non finalisé</em>
      </h1>

      <p className="mt-4 max-w-md text-base text-ink-soft">
        Vous avez annulé la session Stripe ou votre carte a été refusée. Aucun débit
        n'a été effectué. Votre configuration est sauvegardée — vous pouvez reprendre
        au point où vous vous étiez arrêtée.
      </p>

      <Card padding="md" variant="muted" className="mt-8 w-full text-left">
        <h2 className="font-serif text-base font-medium text-aubergine">
          Que faire ?
        </h2>
        <ul className="mt-3 space-y-2.5 text-sm text-ink-soft">
          <li>
            · Vérifiez que votre carte n'est pas expirée et que votre plafond couvre le montant.
          </li>
          <li>
            · Si vous utilisez 3D Secure, validez bien la notification de votre banque.
          </li>
          <li>
            · Essayez une autre carte si le problème persiste.
          </li>
          <li>
            · En test mode, utilise la carte <code className="rounded bg-cream-warm px-1.5 py-0.5 font-mono text-[10px]">4242 4242 4242 4242</code> (Stripe test card, n'importe quelle date future + n'importe quel CVC).
          </li>
        </ul>
      </Card>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Button asChild size="lg" leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}>
          <Link href="/onboarding/recap">Réessayer le paiement</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden />}>
          <Link href="/onboarding/forfait">Modifier mon forfait</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" leftIcon={<LifeBuoy className="h-3.5 w-3.5" aria-hidden />}>
          <Link href="/aide">Contacter le support</Link>
        </Button>
      </div>
    </div>
  );
}
