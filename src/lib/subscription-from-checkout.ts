import "server-only";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/**
 * Récupère une Stripe Checkout Session, vérifie qu'elle est complète,
 * puis persiste la Subscription correspondante en DB.
 *
 * Idempotent — appelé plusieurs fois (refresh page success), upsert ne dupliquera pas.
 *
 * Plan B au webhook Stripe : utile en local quand stripe-cli est bloqué (DNS, ISP, etc.).
 * En production avec Vercel, on basculera sur le webhook qui gère aussi les events
 * post-souscription (cancel, payment_failed, renewal).
 */
export async function verifyAndPersistSubscription(
  sessionId: string,
  userIdHint?: string
): Promise<
  | { ok: true; planSlug: string; subscriptionId: string; alreadyPersisted: boolean }
  | { ok: false; error: string }
> {
  if (!sessionId) {
    return { ok: false, error: "Session ID manquant dans l'URL." };
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "subscription.items.data.price"],
    });
  } catch (err) {
    return {
      ok: false,
      error: `Stripe ne reconnaît pas cette session (${err instanceof Error ? err.message : "?"}).`,
    };
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return {
      ok: false,
      error: `Cette session n'est pas finalisée (status: ${session.status}, payment: ${session.payment_status}).`,
    };
  }

  // Trouver le User : par userIdHint (si on connaît la session côté serveur) ou par customer_email
  const userEmail = session.customer_email ?? session.client_reference_id ?? undefined;
  const user = userIdHint
    ? await prisma.user.findUnique({ where: { id: userIdHint } })
    : userEmail
    ? await prisma.user.findUnique({ where: { email: userEmail } })
    : null;

  if (!user) {
    return {
      ok: false,
      error: "Utilisateur introuvable en base. Reconnectez-vous puis réessayez.",
    };
  }

  // Lier User <-> Stripe Customer
  if (
    session.customer &&
    typeof session.customer === "string" &&
    user.stripeCustomerId !== session.customer
  ) {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: session.customer },
    });
  }

  // Récupérer la subscription créée par le checkout
  const subRef = session.subscription;
  if (!subRef) {
    return { ok: false, error: "Aucune souscription liée à cette session Stripe." };
  }
  const sub: Stripe.Subscription =
    typeof subRef === "string" ? await stripe.subscriptions.retrieve(subRef) : subRef;

  // Vérifier qu'on a bien un price+plan en DB
  const item = sub.items.data[0];
  const stripePriceId = item?.price.id;
  if (!stripePriceId) {
    return { ok: false, error: "La souscription Stripe n'a pas de prix associé." };
  }
  const plan = await prisma.plan.findUnique({ where: { stripePriceId } });
  if (!plan) {
    return {
      ok: false,
      error: `Le prix Stripe ${stripePriceId} n'est pas seedé en DB.`,
    };
  }

  // Vérifier si déjà persistée (idempotence)
  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
  });

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
      userId: user.id,
      planId: plan.id,
      stripeSubscriptionId: sub.id,
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
  });

  if (!existing) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "SUBSCRIPTION_CREATED_VIA_SUCCESS_PAGE",
        target: `subscription:${sub.id}`,
        after: { planSlug: plan.slug, status, periodEnd: item.current_period_end },
      },
    });

    // Première création de la Subscription → envoie l'email de bienvenue.
    // Best-effort : si Resend est indispo, on log mais on ne fait pas échouer la souscription.
    try {
      const [villaCount, whatsapp] = await Promise.all([
        prisma.villa.count({ where: { userId: user.id, deletedAt: null } }),
        prisma.whatsAppNumber.findFirst({
          where: { userId: user.id, status: "VERIFIED" },
          orderBy: { verifiedAt: "desc" },
          select: { e164: true },
        }),
      ]);
      const { sendWelcomeEmail } = await import("@/lib/email");
      await sendWelcomeEmail({
        to: user.email,
        firstName: user.name?.split(" ")[0] ?? null,
        planLabel: plan.label,
        villaCount,
        whatsappE164: whatsapp?.e164 ?? null,
      });
    } catch (e) {
      console.warn("[subscription-from-checkout] welcome email failed:", e);
    }
  }

  return {
    ok: true,
    planSlug: plan.slug,
    subscriptionId: sub.id,
    alreadyPersisted: !!existing,
  };
}

function mapStripeStatus(s: Stripe.Subscription.Status) {
  const map: Record<
    Stripe.Subscription.Status,
    | "TRIALING"
    | "ACTIVE"
    | "PAST_DUE"
    | "CANCELED"
    | "INCOMPLETE"
    | "INCOMPLETE_EXPIRED"
    | "UNPAID"
    | "PAUSED"
  > = {
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
