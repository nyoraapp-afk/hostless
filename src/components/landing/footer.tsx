import Link from "next/link";
import { Logo } from "@/components/logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-cream-warm/40 px-6 py-10">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-xs text-ink-muted">© 2026</span>
        </div>
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
  );
}
