"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

/**
 * Hero de la landing — fond aubergine, titre Lora italic, CTA "Voir nos offres".
 * Port de v34 p1 #hero (lignes 678-691).
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-aubergine-deep px-6 py-20 sm:py-28 text-on-aubergine">
      {/* Halo poudre en arrière-plan, discret */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-powder/8 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-10 flex justify-center">
          <Logo size="lg" variant="on-aubergine" />
        </div>

        <h1 className="font-serif text-4xl font-normal leading-tight tracking-tight sm:text-5xl md:text-6xl">
          <em className="not-italic font-normal italic">hostelyo lit.</em>
          <br />
          <em className="not-italic font-normal italic text-powder">
            Votre équipe agit.
          </em>
        </h1>

        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-on-aubergine-soft sm:text-lg">
          Nous analysons vos messages Airbnb 24h/24, vous alertons uniquement
          quand c'est nécessaire et prévenons directement le bon intervenant.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-powder text-aubergine-deep hover:bg-powder-light"
          >
            <a href="#pricing">
              Voir nos offres
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </Button>
          <p className="text-xs text-on-aubergine-muted">
            Activation en 2 minutes · Sans engagement
          </p>
        </div>

        <p className="mt-6 text-sm text-on-aubergine-soft">
          Vous avez déjà un compte ?{" "}
          <Link
            href="/login"
            className="font-medium text-powder underline underline-offset-4 hover:text-powder-light"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </section>
  );
}
