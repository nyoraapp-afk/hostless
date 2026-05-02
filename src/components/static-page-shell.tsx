import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

/**
 * Shell partagé pour toutes les pages statiques (aide, légal, privacy, CGU).
 * Header logo + bouton retour, footer minimal, contenu en typo Lora/Inter.
 */
export function StaticPageShell({
  eyebrow,
  title,
  children,
  lastUpdate,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children: React.ReactNode;
  /** Date de dernière mise à jour, ex "26 avril 2026". */
  lastUpdate?: string;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-cream">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
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

      <article className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-16">
        <div className="text-eyebrow mb-3">{eyebrow}</div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
          {title}
        </h1>
        {lastUpdate && (
          <p className="mt-2 text-xs text-ink-muted">
            Dernière mise à jour : {lastUpdate}
          </p>
        )}

        <div className="prose prose-aubergine mt-8 max-w-none text-sm text-ink-soft leading-relaxed [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-aubergine [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-aubergine [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:ml-6 [&_ul]:list-disc [&_strong]:font-semibold [&_strong]:text-ink [&_a]:text-aubergine [&_a]:underline [&_a:hover]:text-aubergine-medium">
          {children}
        </div>
      </article>

      <footer className="border-t border-border bg-cream-warm/40 px-6 py-6">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Logo size="sm" />
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <Link href="/tarifs" className="hover:text-aubergine">
              Tarifs
            </Link>
            <span aria-hidden>·</span>
            <Link href="/a-propos" className="hover:text-aubergine">
              À propos
            </Link>
            <span aria-hidden>·</span>
            <Link href="/aide" className="hover:text-aubergine">
              Aide
            </Link>
            <span aria-hidden>·</span>
            <Link href="/contact" className="hover:text-aubergine">
              Contact
            </Link>
            <span aria-hidden>·</span>
            <Link href="/legal" className="hover:text-aubergine">
              Mentions légales
            </Link>
            <span aria-hidden>·</span>
            <Link href="/privacy" className="hover:text-aubergine">
              Confidentialité
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
