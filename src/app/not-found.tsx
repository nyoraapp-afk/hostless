import type { Metadata } from "next";
import Link from "next/link";
import { Compass, ArrowLeft, Home } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Page introuvable",
  description: "Cette page n'existe pas ou n'existe plus.",
};

/**
 * Page 404 — Next.js l'utilise automatiquement pour toute URL non matchée.
 *
 * Brand-aligned : aubergine, Lora italic, voix calme.
 */
export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col bg-cream">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" aria-label="Retour à l'accueil">
            <Logo size="md" />
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Accueil
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-aubergine-50 text-aubergine">
            <Compass className="h-8 w-8" aria-hidden />
          </div>

          <div className="text-eyebrow mb-3">Erreur 404</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
            Cette page <em className="text-aubergine-medium">n'existe pas</em>
          </h1>
          <p className="mt-3 text-base text-ink-soft">
            Cette page semble obsolète ou a été déplacée. Pas de stress,
            on vous remet sur la voie.
          </p>

          <Card padding="md" variant="muted" className="mt-8 text-left">
            <p className="text-sm font-medium text-aubergine mb-3">
              Quelques pages utiles
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-aubergine hover:text-aubergine-medium underline"
                >
                  Accueil
                </Link>{" "}
                <span className="text-ink-muted">— présentation du service</span>
              </li>
              <li>
                <Link
                  href="/tarifs"
                  className="text-aubergine hover:text-aubergine-medium underline"
                >
                  Tarifs
                </Link>{" "}
                <span className="text-ink-muted">— Essentiel et Sérénité détaillés</span>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-aubergine hover:text-aubergine-medium underline"
                >
                  Dashboard
                </Link>{" "}
                <span className="text-ink-muted">— si vous avez déjà un compte</span>
              </li>
              <li>
                <Link
                  href="/aide"
                  className="text-aubergine hover:text-aubergine-medium underline"
                >
                  Centre d'aide
                </Link>{" "}
                <span className="text-ink-muted">— FAQ et contact</span>
              </li>
            </ul>
          </Card>

          <div className="mt-8 flex flex-col items-center gap-2">
            <Button asChild size="lg">
              <Link href="/">
                <Home className="h-4 w-4" aria-hidden />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
