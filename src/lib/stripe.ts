import Stripe from "stripe";

/**
 * Client Stripe serveur. NE JAMAIS importer ce module dans du code client.
 * Utiliser NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY côté client si besoin de Stripe.js.
 */

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("STRIPE_SECRET_KEY manquante");
  }
  // En dev, on tolère l'absence pour permettre les builds avant que les creds ne soient là.
  console.warn("[stripe] STRIPE_SECRET_KEY manquante — appels Stripe vont échouer.");
}

export const stripe = new Stripe(key ?? "placeholder_dev_only", {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});

export const STRIPE_PRICE_IDS = {
  ESSENTIEL: process.env.STRIPE_PRICE_ID_ESSENTIEL ?? "",
  SERENITE: process.env.STRIPE_PRICE_ID_SERENITE ?? "",
} as const;
