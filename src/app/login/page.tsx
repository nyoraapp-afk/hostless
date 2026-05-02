import Link from "next/link";
import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, Clock, Forward, Sparkles, Zap } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Feature flag : l'option Forwarding est activée uniquement quand le webhook
 * secret Resend est configuré (signe qu'on a Resend Pro avec Inbound).
 *
 * En attendant, on affiche la card désactivée avec "Disponible bientôt".
 * Le code complet du forwarding existe — on le débloque le jour où
 * RESEND_INBOUND_WEBHOOK_SECRET est défini en .env.
 */
const FORWARDING_ENABLED = !!process.env.RESEND_INBOUND_WEBHOOK_SECRET;

/**
 * Page de connexion — 2 méthodes au choix :
 *
 *   Option 1 (par défaut, recommandée) — "Connexion Google · 1 clic"
 *     OAuth Gmail readonly. Pour les hôtes Gmail (~70% du marché).
 *
 *   Option 2 (alternative) — "Configurer un transfert email"
 *     Pour les hôtes Outlook/iCloud/Yahoo, ou ceux qui ne veulent pas donner
 *     accès à leur boîte. On leur attribue un alias unique `*@in.hostelyo.com`,
 *     ils configurent un forwarding depuis leur provider.
 *
 * Si déjà authentifié → redirect /dashboard.
 */
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col bg-cream">
      {/* Header simple */}
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Logo size="md" />
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Retour
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <header className="text-center mb-8">
            <h1 className="font-serif text-3xl font-medium tracking-tight text-aubergine sm:text-4xl">
              Choisissez votre <em className="text-aubergine-medium">méthode de connexion</em>
            </h1>
            <p className="mt-3 text-sm text-ink-soft sm:text-base">
              hostelyo lit vos messages Airbnb pour vous alerter uniquement sur les vraies urgences.
              Choisissez comment nous donner accès à ces messages.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* OPTION 1 — Google OAuth (par défaut, mise en avant) */}
            <Card className="relative border-2 border-aubergine shadow-md" padding="md">
              <Badge
                variant="premium"
                size="sm"
                className="absolute -top-2.5 right-4 shadow-sm"
              >
                <Sparkles className="h-3 w-3" aria-hidden />
                Le plus rapide
              </Badge>

              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-aubergine-50 mb-4">
                <Zap className="h-5 w-5 text-aubergine" aria-hidden />
              </div>

              <h2 className="font-serif text-lg font-medium text-aubergine">
                Connexion Google
              </h2>
              <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                Pour les hôtes <strong>Gmail</strong>. Configuration en{" "}
                <strong className="text-aubergine">1 clic</strong>. Nous accédons à votre boîte
                en lecture seule, scope <code className="font-mono text-[10px]">gmail.readonly</code>.
              </p>

              <ul className="mt-4 space-y-1.5 text-xs text-ink-soft">
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 shrink-0 mt-0.5 text-success" aria-hidden />
                  <span>Activation immédiate, aucune config technique</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 shrink-0 mt-0.5 text-success" aria-hidden />
                  <span>Détection automatique de vos villas existantes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 shrink-0 mt-0.5 text-success" aria-hidden />
                  <span>Révocable à tout moment depuis votre compte Google</span>
                </li>
              </ul>

              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/onboarding/scan" });
                }}
                className="mt-5"
              >
                <Button type="submit" size="md" block>
                  <GoogleIcon />
                  Continuer avec Google
                </Button>
              </form>
            </Card>

            {/* OPTION 2 — Email forwarding (alternative) — désactivée pour MVP free tier */}
            <Card
              className={
                FORWARDING_ENABLED
                  ? "relative border border-border"
                  : "relative border border-border opacity-70 bg-cream-warm/30"
              }
              padding="md"
            >
              {!FORWARDING_ENABLED && (
                <Badge
                  variant="warning"
                  size="sm"
                  className="absolute -top-2.5 right-4 shadow-sm"
                >
                  <Clock className="h-3 w-3" aria-hidden />
                  Bientôt disponible
                </Badge>
              )}

              <div
                className={
                  "flex h-10 w-10 items-center justify-center rounded-md mb-4 " +
                  (FORWARDING_ENABLED ? "bg-cream-warm" : "bg-cream-warm/50")
                }
              >
                <Forward className="h-5 w-5 text-ink-muted" aria-hidden />
              </div>

              <h2 className="font-serif text-lg font-medium text-aubergine">
                Transfert email
              </h2>
              <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                Pour <strong>Outlook, iCloud, Yahoo</strong> ou si vous ne voulez pas donner
                accès à votre Gmail. Vous configurez un transfert automatique vers une adresse
                qu'on vous attribue.
              </p>

              <ul className="mt-4 space-y-1.5 text-xs text-ink-soft">
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 shrink-0 mt-0.5 text-success" aria-hidden />
                  <span>Aucun accès direct à votre boîte mail</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="size-3.5 shrink-0 mt-0.5 text-success" aria-hidden />
                  <span>Marche avec n'importe quel email (pas que Gmail)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-ink-muted font-bold">·</span>
                  <span className="text-ink-muted">~5 min de configuration une fois</span>
                </li>
              </ul>

              {FORWARDING_ENABLED ? (
                <>
                  <form
                    action={async () => {
                      "use server";
                      await signIn("google", { redirectTo: "/onboarding/forwarding" });
                    }}
                    className="mt-5"
                  >
                    <Button type="submit" size="md" block variant="outline">
                      Configurer un transfert
                    </Button>
                  </form>
                  <p className="mt-2 text-[10px] text-ink-muted text-center">
                    Vous vous identifierez quand même avec Google pour créer votre compte.
                  </p>
                </>
              ) : (
                <>
                  <Button size="md" block variant="outline" disabled className="mt-5">
                    Bientôt disponible
                  </Button>
                  <p className="mt-2 text-[10px] text-ink-muted text-center">
                    Pour l'instant, utilisez la connexion Google. Le transfert email arrive
                    dans une prochaine version.
                  </p>
                </>
              )}
            </Card>
          </div>

          <p className="mt-8 mx-auto max-w-md text-center text-xs leading-relaxed text-ink-muted">
            En continuant, vous acceptez nos{" "}
            <Link href="/legal" className="underline hover:text-aubergine">
              conditions d'utilisation
            </Link>{" "}
            et notre{" "}
            <Link href="/privacy" className="underline hover:text-aubergine">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
