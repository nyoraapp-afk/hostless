import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { z } from "zod";

/**
 * POST /api/checkout — crée une session Stripe Checkout pour l'utilisateur authentifié.
 *
 * Body : { plan: "ESSENTIEL" | "SERENITE", quantity: number }
 *
 * Retourne l'URL Stripe vers laquelle le client doit être redirigé.
 *
 * TODO Phase 1.B — quand la DB sera là, on créera/réutilisera un Stripe Customer
 * via stripeCustomerId stocké sur User. Pour l'instant Checkout collecte l'email.
 */

const BodySchema = z.object({
  plan: z.enum(["ESSENTIEL", "SERENITE"]),
  quantity: z.number().int().min(1).max(50),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Body invalide", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { plan, quantity } = parsed.data;
  const priceId = STRIPE_PRICE_IDS[plan];
  if (!priceId) {
    return NextResponse.json(
      { error: `Price ID Stripe manquant pour ${plan}` },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3030";

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      customer_email: session.user.email,
      success_url: `${baseUrl}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/onboarding/error`,
      // Permet à Stripe de récupérer le user côté webhook (Phase 1.B)
      client_reference_id: session.user.email,
      metadata: {
        plan,
        quantity: String(quantity),
        userEmail: session.user.email,
      },
      subscription_data: {
        metadata: {
          plan,
          userEmail: session.user.email,
        },
      },
      locale: "fr",
      allow_promotion_codes: true,
    });

    if (!checkout.url) {
      return NextResponse.json(
        { error: "Stripe n'a pas retourné d'URL de checkout" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur Stripe inconnue";
    console.error("[checkout] Stripe error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
