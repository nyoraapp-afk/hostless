import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/stripe/webhook
 *
 * Endpoint qui re\u00e7oit les \u00e9v\u00e9nements Stripe (paiement r\u00e9ussi/\u00e9chou\u00e9, sub cr\u00e9\u00e9e/r\u00e9sili\u00e9e).
 *
 * V\u00e9rification de signature obligatoire via STRIPE_WEBHOOK_SECRET (sinon faille
 * permettant \u00e0 n'importe qui de cr\u00e9er des Subscription factices en POST direct).
 *
 * \u00c9v\u00e9nements g\u00e9r\u00e9s (Phase 1.B) :
 *   - checkout.session.completed   → cr\u00e9e/lie le User \u00e0 Stripe + cr\u00e9e Subscription
 *   - customer.subscription.updated → met \u00e0 jour status, periodEnd, cancelAt
 *   - customer.subscription.deleted → marque CANCELED
 *
 * \u00c0 venir (Phase 9) : invoice.payment_failed → notif email + StateBadge "failed".
 */

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET manquant");
    return NextResponse.json(
      { error: "Webhook non configur\u00e9 c\u00f4t\u00e9 serveur" },
      { status: 500 }
    );
  }
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature invalide";
    console.error("[stripe webhook] signature check failed:", msg);
    return NextResponse.json({ error: `Signature invalide: ${msg}` }, { status: 400 });
  }

  console.log(`[stripe webhook] received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event.data.object);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        await handleSubscriptionUpsert(event.data.object);
        break;
      }
      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event.data.object);
        break;
      }
      default:
        // \u00c9v\u00e9nements ignor\u00e9s pour l'instant — on ack juste \u00e0 Stripe pour qu'il arr\u00eate de retry
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur webhook inconnue";
    console.error(`[stripe webhook] handler failed for ${event.type}:`, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true, event: event.type });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userEmail = session.customer_email ?? session.client_reference_id;
  if (!userEmail) {
    console.warn("[stripe webhook] checkout.session.completed sans email", session.id);
    return;
  }
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    console.warn(`[stripe webhook] user ${userEmail} introuvable en DB`);
    return;
  }

  // Lie le user \u00e0 son Customer Stripe (pour le portail Stripe + futurs Checkout)
  if (session.customer && typeof session.customer === "string") {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: session.customer },
    });
  }

  // R\u00e9cup\u00e8re la souscription cr\u00e9\u00e9e par ce checkout
  if (!session.subscription || typeof session.subscription !== "string") {
    return;
  }
  const sub = await stripe.subscriptions.retrieve(session.subscription, {
    expand: ["items.data.price"],
  });
  await persistSubscription(user.id, sub);
}

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  // R\u00e9soudre le user via metadata.userEmail (pos\u00e9 \u00e0 la cr\u00e9ation du checkout)
  const userEmail = sub.metadata?.userEmail;
  if (!userEmail) {
    console.warn(`[stripe webhook] sub ${sub.id} sans metadata.userEmail`);
    return;
  }
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    console.warn(`[stripe webhook] sub ${sub.id} → user ${userEmail} introuvable`);
    return;
  }
  await persistSubscription(user.id, sub);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: {
      status: "CANCELED",
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : new Date(),
    },
  });
  await prisma.auditLog.create({
    data: {
      action: "SUBSCRIPTION_CANCELED",
      target: `subscription:${sub.id}`,
      after: { status: "CANCELED", canceledAt: sub.canceled_at },
    },
  });
}

/**
 * Mappe une Stripe.Subscription vers notre table Subscription (upsert par stripeSubscriptionId).
 */
async function persistSubscription(userId: string, sub: Stripe.Subscription) {
  // R\u00e9soudre le Plan en DB \u00e0 partir du stripePriceId
  // Stripe SDK 22+ : current_period_start/end sont sur SubscriptionItem (single-line ici)
  const item = sub.items.data[0];
  const stripePriceId = item?.price.id;
  if (!stripePriceId) {
    console.warn(`[stripe webhook] sub ${sub.id} sans price`);
    return;
  }
  const plan = await prisma.plan.findUnique({ where: { stripePriceId } });
  if (!plan) {
    console.warn(`[stripe webhook] price ${stripePriceId} non seed\u00e9 en DB`);
    return;
  }

  const periodStart = item.current_period_start
    ? new Date(item.current_period_start * 1000)
    : null;
  const periodEnd = item.current_period_end
    ? new Date(item.current_period_end * 1000)
    : null;

  const status = mapStripeStatus(sub.status);

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    update: {
      planId: plan.id,
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
    create: {
      userId,
      planId: plan.id,
      stripeSubscriptionId: sub.id,
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "SUBSCRIPTION_UPSERTED",
      target: `subscription:${sub.id}`,
      after: { planSlug: plan.slug, status, periodEnd: item.current_period_end },
    },
  });
}

function mapStripeStatus(s: Stripe.Subscription.Status) {
  const map: Record<Stripe.Subscription.Status, "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "INCOMPLETE" | "INCOMPLETE_EXPIRED" | "UNPAID" | "PAUSED"> = {
    trialing: "TRIALING",
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    incomplete: "INCOMPLETE",
    incomplete_expired: "INCOMPLETE_EXPIRED",
    unpaid: "UNPAID",
    paused: "PAUSED",
  };
  return map[s];
}
