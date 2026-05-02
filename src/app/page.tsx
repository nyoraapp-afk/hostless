import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { Promise } from "@/components/landing/promise";
import { Pricing } from "@/components/landing/pricing";
import { LandingFooter } from "@/components/landing/footer";

/**
 * Landing publique — port de v34 p1.
 * Sections : Hero / Problem / Promise / Pricing / Footer.
 * Le bouton "Commencer maintenant" → /login → OAuth Google → /onboarding.
 */
export default function LandingPage() {
  return (
    <main className="flex flex-col">
      <Hero />
      <Problem />
      <Promise />
      <Pricing />
      <LandingFooter />
    </main>
  );
}
