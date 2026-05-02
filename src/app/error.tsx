"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home, Mail } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Page 500 (erreur runtime) — Next.js l'utilise automatiquement pour toute exception
 * non gérée pendant le rendu serveur ou client.
 *
 * Doit être un client component (use client) car elle utilise reset() de Next.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // En prod on enverra à Sentry ici (Phase 9)
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col bg-cream">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center">
          <Link href="/" aria-label="Retour à l'accueil">
            <Logo size="md" />
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error">
            <AlertCircle className="h-8 w-8" aria-hidden />
          </div>

          <div className="text-eyebrow mb-3 text-error">Erreur inattendue</div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
            Quelque chose <em className="text-aubergine-medium">a mal tourné</em>
          </h1>
          <p className="mt-3 text-base text-ink-soft">
            Notre équipe a été automatiquement notifiée. Vous pouvez réessayer
            tout de suite, ou si le problème persiste, nous écrire — on regardera vite.
          </p>

          {error.digest && (
            <Card padding="sm" variant="muted" className="mt-6 text-left">
              <p className="text-xs text-ink-muted">
                Code de référence (à mentionner si vous nous écrivez) :
              </p>
              <code className="mt-1 block font-mono text-xs text-aubergine break-all">
                {error.digest}
              </code>
            </Card>
          )}

          <div className="mt-8 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
            <Button onClick={reset} leftIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden />}>
              Réessayer
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">
                <Home className="h-3.5 w-3.5" aria-hidden />
                Accueil
              </Link>
            </Button>
            <Button asChild variant="ghost" size="md">
              <Link href="/contact">
                <Mail className="h-3.5 w-3.5" aria-hidden />
                Nous écrire
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
