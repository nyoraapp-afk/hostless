import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";

/**
 * Layout commun à tout le flow d'onboarding (p2 → p9 du proto).
 * Garde l'utilisateur authentifié et fournit un header simple avec progress.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="border-b border-border bg-cream/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Logo size="md" />
          <span className="text-xs text-ink-muted">
            Connecté · {session.user.email}
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
